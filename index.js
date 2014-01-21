var Stream = require('stream');
var Protobuf = require('protobuf.js');
var riakproto = require('riakproto');
var _merge = require('./lib/merge');
var parseResponse = require('./lib/parse-response');
var ConnectionManager = require('./lib/connection-manager');

function RiakPBC(options) {
    options = options || {};
    options.host = options.host || '127.0.0.1';
    options.port = options.port || 8087;
    options.timeout = options.timeout || 1000;
    options.auto_connect = options.hasOwnProperty('auto_connect') ? options.auto_connect : true;

    this.connection = new ConnectionManager(options);
    this.connection.receive = this._processPacket.bind(this);

    this.translator = new Protobuf(riakproto);

    this.paused = false;
    this.queue = [];
    this.reply = {};
    this.resBuffers = [];
    this.numBytesAwaiting = 0;
}

RiakPBC.prototype._splitPacket = function (pkt) {
    var self = this;
    var pos = 0;
    var len;

    if (self.numBytesAwaiting > 0) {
        len = Math.min(pkt.length, self.numBytesAwaiting);
        var oldBuf = self.resBuffers[self.resBuffers.length - 1];
        var newBuf = new Buffer(oldBuf.length + len);
        oldBuf.copy(newBuf, 0);
        pkt.slice(0, len).copy(newBuf, oldBuf.length);
        self.resBuffers[self.resBuffers.length - 1] = newBuf;
        pos = len;
        self.numBytesAwaiting -= len;
    } else {
        self.resBuffers = [];
    }

    while (pos < pkt.length) {
        len = pkt.readInt32BE(pos);
        self.numBytesAwaiting = len + 4 - pkt.length;
        self.resBuffers.push(pkt.slice(pos + 4, Math.min(pos + len + 4, pkt.length)));
        pos += len + 4;
    }
};

RiakPBC.prototype._processPacket = function (chunk) {
    this._splitPacket(chunk);
    if (this.numBytesAwaiting > 0) {
        return;
    }
    this._processAllResBuffers();
};

RiakPBC.prototype._processAllResBuffers = function () {
    var self = this;
    var stream = self.task.stream;
    var cb = self.task.callback;
    var mc, err;

    self.resBuffers.forEach(processSingleResBuffer);

    if (!self.task.expectMultiple || self.reply.done || mc === 'RpbErrorResp') {
        self.task = undefined;

        if (stream) {
            stream.end();
        } else {
            cb(err, self.reply);
        }

        mc = undefined;
        self.reply = {};
        self.paused = false;
        self._processNext();
    }

    function processSingleResBuffer(packet) {
        var response;

        mc = riakproto.codes['' + packet[0]];

        response = self.translator.decode(mc, packet.slice(1));
        if (response) {
            response = parseResponse(response);
        }

        if (response.errmsg) {
            err = new Error(response.errmsg);
            err.code = response.errcode;
            if (stream) {
                stream.emit('error', err);
                return;
            }
        }

        if (stream && !response.done) {
            stream.write(response);
        }

        if (stream) {
            self.reply = response;
        } else {
            self.reply = _merge(self.reply, response);
        }
    }
};

RiakPBC.prototype._processNext = function () {
    if (!this.queue.length || this.paused) {
        return;
    }

    this.paused = true;
    this.task = this.queue.shift();

    if (!this.task) {
        return;
    }

    this.connection.send(this.task.message, function (err) {
        if (err) {
            if (this.task.callback) {
                return this.task.callback(err);
            }

            if (this.task.stream) {
                return this.task.stream.emit('error', err);
            }

            throw err;
        }
    }.bind(this));
};

// RiakPBC.prototype.makeRequest = function (type, data, callback, expectMultiple, streaming) {
RiakPBC.prototype.makeRequest = function (opts) {
    var buffer, message, stream;

    if (riakproto.messages[opts.type]) {
        buffer = this.translator.encode(opts.type, opts.params);
    } else {
        buffer = new Buffer(0);
    }

    message = new Buffer(buffer.length + 5);

    if (opts.streaming) {
        stream = writableStream();
    }

    message.writeInt32BE(buffer.length + 1, 0);
    message.writeInt8(riakproto.codes[opts.type], 4);
    buffer.copy(message, 5);
    
    this.queue.push({
        message: message,
        callback: opts.callback,
        expectMultiple: opts.expectMultiple,
        stream: stream
    });

    this._processNext();

    return stream;
};

RiakPBC.prototype.getBuckets = function (callback) {
    return this.makeRequest({
        type: 'RpbListBucketsReq',
        params: null,
        callback: callback
    });
};

RiakPBC.prototype.getBucket = function (params, callback) {
    return this.makeRequest({
        type: 'RpbGetBucketReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.setBucket = function (params, callback) {
    return this.makeRequest({
        type: 'RpbSetBucketReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.resetBucket = function (params, callback) {
    return this.makeRequest({
        type: 'RpbResetBucketReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getKeys = function (params, streaming, callback) {
    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
    }

    return this.makeRequest({
        type: 'RpbListKeysReq',
        params: params,
        expectMultiple: true,
        callback: callback,
        streaming: streaming
    });
};

RiakPBC.prototype.put = function (params, callback) {
    return this.makeRequest({
        type: 'RpbPutReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.get = function (params, callback) {
    return this.makeRequest({
        type: 'RpbGetReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.del = function (params, callback) {
    return this.makeRequest({
        type: 'RpbDelReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.mapred = function (params, streaming, callback) {
    var stream;

    function cb(err, reply) {
        if (err) {
            return callback(err);
        }

        delete reply.done;
        var phaseKeys = Object.keys(reply);
        var rows = [];
        var phase;

        phaseKeys.forEach(function (key) {
            phase = reply[key];
            phase.forEach(function (row) {
                rows.push(row);
            });
        });

        callback(null, rows);
    }

    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
    }

    stream = this.makeRequest({
        type: 'RpbMapRedReq',
        params: params,
        callback: cb,
        expectMultiple: true,
        streaming: streaming
    });

    return streaming ? parseMapReduceStream(stream) : stream;
};


RiakPBC.prototype.getCounter = function (params, callback) {
    return this.makeRequest({
        type: 'RpbCounterGetReq',
        params: params,
        callback: callback
    });
};


RiakPBC.prototype.updateCounter = function (params, callback) {
    return this.makeRequest({
        type: 'RpbCounterUpdateReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getIndex = function (params, streaming, callback) {
    var expectMultiple = true;

    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
        expectMultiple = false;
    } else {
        params.stream = true;
    }

    return this.makeRequest({
        type: 'RpbIndexReq',
        params: params,
        streaming: streaming,
        expectMultiple: expectMultiple,
        callback: callback
    });
};

RiakPBC.prototype.search = function (params, callback) {
    return this.makeRequest({
        type: 'RpbSearchQueryReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getClientId = function (callback) {
    return this.makeRequest({
        type: 'RpbGetClientIdReq',
        params: null,
        callback: callback
    });
};

RiakPBC.prototype.setClientId = function (params, callback) {
    return this.makeRequest({
        type: 'RpbSetClientIdReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getServerInfo = function (callback) {
    return this.makeRequest({
        type: 'RpbGetServerInfoReq',
        params: null,
        callback: callback
    });
};

RiakPBC.prototype.ping = function (callback) {
    return this.makeRequest({
        type: 'RpbPingReq',
        params: null,
        callback: callback
    });
};

RiakPBC.prototype.connect = function (callback) {
    this.connection.connect(callback);
};

RiakPBC.prototype.disconnect = function () {
    if (this.task) {
        this.queue.unshift(this.task);
        this.task = undefined;
    }

    this.connection.disconnect();
};

exports.createClient = function (options) {
    return new RiakPBC(options);
};

function writableStream() {
    var stream = new Stream.Transform({ objectMode: true });

    stream._transform = function (chunk, encoding, done) {
        this.push(chunk);
        done();
    };

    return stream;
}

function parseMapReduceStream(rawStream) {
    var liner = new Stream.Transform({ objectMode: true });

    liner._transform = function (chunk, encoding, done) {
        var response = chunk.response;
        var json = JSON.parse(response);
        var self = this;

        json.forEach(function (row) {
            self.push(row);
        });

        done();
    };

    rawStream.on('error', function (err) {
        liner.emit('error', err);
    });

    rawStream.pipe(liner);
    return liner;
}
