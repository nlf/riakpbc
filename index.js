var net = require('net'),
    Stream = require('stream'),
    protobuf = require('protobuf.js'),
    butils = require('butils'),
    through = require('through'),
    path = require('path'),
    _merge = require('./lib/merge'),
    nextTick = setImmediate || process.nextTick;

var messageCodes = {
    '0': 'RpbErrorResp',
    '1': 'RpbPingReq',
    '2': 'RpbPingResp',
    '3': 'RpbGetClientIdReq',
    '4': 'RpbGetClientIdResp',
    '5': 'RpbSetClientIdReq',
    '6': 'RpbSetClientIdResp',
    '7': 'RpbGetServerInfoReq',
    '8': 'RpbGetServerInfoResp',
    '9': 'RpbGetReq',
    '10': 'RpbGetResp',
    '11': 'RpbPutReq',
    '12': 'RpbPutResp',
    '13': 'RpbDelReq',
    '14': 'RpbDelResp',
    '15': 'RpbListBucketsReq',
    '16': 'RpbListBucketsResp',
    '17': 'RpbListKeysReq',
    '18': 'RpbListKeysResp',
    '19': 'RpbGetBucketReq',
    '20': 'RpbGetBucketResp',
    '21': 'RpbSetBucketReq',
    '22': 'RpbSetBucketResp',
    '23': 'RpbMapRedReq',
    '24': 'RpbMapRedResp',
    '25': 'RpbIndexReq',
    '26': 'RpbIndexResp',
    '27': 'RpbSearchQueryReq',
    '28': 'RpbSearchQueryResp',
    // 1.4
    '29': 'RpbResetBucketReq',
    '30': 'RpbResetBucketResp',
    '40': 'RpbCSBucketReq',
    '41': 'RpbCSBucketResp',
    '50': 'RpbCounterUpdateReq',
    '51': 'RpbCounterUpdateResp',
    '52': 'RpbCounterGetReq',
    '53': 'RpbCounterGetResp',
};
Object.keys(messageCodes).forEach(function (key) {
    messageCodes[messageCodes[key]] = Number(key);
});

function contentMap(item) {
    if (item.value && item.content_type) {
        if (item.content_type.match(/^(text\/\*)|(application\/json)$/)) item.value = item.value.toString();
    }
    return item;
}

function RiakPBC(options) {
    var self = this;
    options = options || {};
    self.host = options.host || '127.0.0.1';
    self.port = options.port || 8087;
    self.timeout = options.timeout || 1000;
    self.bucket = options.bucket || undefined;
    self.translator = protobuf.loadSchema(path.join(__dirname, './spec/riak_kv.proto'));
    self.client = new net.Socket();
    self.connected = false;
    self.client.on('end', self.disconnect.bind(this));
    self.client.on('error', self.disconnect.bind(this));
    self.client.on('data', self._processPacket.bind(this));
    self.paused = false;
    self.queue = [];
    self.reply = {};
    self.resBuffers = [];
    self.numBytesAwaiting = 0;
}

RiakPBC.prototype._splitPacket = function (pkt) {
    var self = this;
    var pos = 0, len;
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
        len = butils.readInt32(pkt, pos);
        self.numBytesAwaiting = len + 4 - pkt.length;
        self.resBuffers.push(pkt.slice(pos + 4, Math.min(pos + len + 4, pkt.length)));
        pos += len + 4;
    }
};

RiakPBC.prototype._processPacket = function (chunk) {
    var self = this;
    var stream = self.task.stream;
    var err, response, packet, mc;

    self._splitPacket(chunk);
    if (self.numBytesAwaiting > 0) {
        return;
    }

    for (var i = 0, l = self.resBuffers.length; i < l; i++) {
        packet = self.resBuffers[i];
        mc = messageCodes['' + packet[0]];

        response = self.translator.decode(mc, packet.slice(1));
        if (response.content && Array.isArray(response.content)) response.content.map(contentMap);

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
        }
        else {
            self.reply = _merge(self.reply, response);
        }
    }
    if (!self.task.expectMultiple || self.reply.done || mc === 'RpbErrorResp') {
        if (err) self.reply = undefined;

        var cb = self.task.callback;
        var emitter = self.task.emitter;
        self.task = undefined;
        if (stream) {
            stream.end();
        } else {
            cb(err, self.reply);
        }
        mc = undefined;
        self.reply = {};
        self.paused = false;
        err = undefined;
        self._processNext();
    }
};

RiakPBC.prototype._processNext = function () {
    var self = this;
    if (self.queue.length && !self.paused) {
        self.paused = true;
        self.connect(function (err) {
            self.task = self.queue.shift();
            if (err) return self.task.callback(err);
            self.client.write(self.task.message);
        });
    }
};

RiakPBC.prototype.makeRequest = function (type, data, callback, expectMultiple, streaming) {
    var self = this,
        buffer = this.translator.encode(type, data),
        message = [],
        stream;

    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
    }

    if (streaming) {
        stream = writableStream();
    }
    butils.writeInt32(message, buffer.length + 1);
    butils.writeInt(message, messageCodes[type], 4);
    message = message.concat(buffer);
    self.queue.push({ message: new Buffer(message), callback: callback, expectMultiple: expectMultiple, stream: stream});
    self._processNext();
    return stream;
};

RiakPBC.prototype.getBuckets = function (callback) {
    return this.makeRequest('RpbListBucketsReq', null, callback);
};

RiakPBC.prototype.getBucket = function (params, callback) {
    this.makeRequest('RpbGetBucketReq', params, callback);
};

RiakPBC.prototype.setBucket = function (params, callback) {
    this.makeRequest('RpbSetBucketReq', params, callback);
};

RiakPBC.prototype.resetBucket = function (params, callback) {
    this.makeRequest('RpbResetBucketReq', params, callback);
};

RiakPBC.prototype.getKeys = function (params, streaming, callback) {
    return this.makeRequest('RpbListKeysReq', params, callback, true, streaming);
};

RiakPBC.prototype.put = function (params, callback) {
    this.makeRequest('RpbPutReq', params, callback);
};

RiakPBC.prototype.get = function (params, callback) {
    this.makeRequest('RpbGetReq', params, callback);
};

RiakPBC.prototype.del = function (params, callback) {
    this.makeRequest('RpbDelReq', params, callback);
};

RiakPBC.prototype.mapred = function (params, streaming, callback) {
    var stream = this.makeRequest('RpbMapRedReq', params, callback, true, streaming);
    if (!stream) {
        return;
    }
    var parsedStream = parseMapReduceStream(stream);
    return parsedStream;
};


RiakPBC.prototype.getCounter = function (params, callback) {
    this.makeRequest('RpbCounterGetReq', params, callback);
};


RiakPBC.prototype.updateCounter = function (params, callback) {
    this.makeRequest('RpbCounterUpdateReq', params, callback);
};

RiakPBC.prototype.getIndex = function (params, streaming, callback) {
    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
    }

    if (streaming) {
        var stream = this.makeRequest('RpbIndexReq', params, callback, true, streaming);
        return stream;
    } else {
        this.makeRequest('RpbIndexReq', params, callback);
    }
};

RiakPBC.prototype.search = function (params, callback) {
    this.makeRequest('RpbSearchQueryReq', params, callback);
};

RiakPBC.prototype.getClientId = function (callback) {
    this.makeRequest('RpbGetClientIdReq', null, callback);
};

RiakPBC.prototype.setClientId = function (params, callback) {
    this.makeRequest('RpbSetClientIdReq', params, callback);
};

RiakPBC.prototype.getServerInfo = function (callback) {
    this.makeRequest('RpbGetServerInfoReq', null, callback);
};

RiakPBC.prototype.ping = function (callback) {
    this.makeRequest('RpbPingReq', null, callback);
};

RiakPBC.prototype.connect = function (callback) {
    if (this.connected) return callback(null);
    var self = this;

    var timeoutGuard = setTimeout(function () {
        callback(new Error('Connection timeout'));
    }, self.timeout);

    self.client.connect(self.port, self.host, function () {
        clearTimeout(timeoutGuard);
        self.connected = true;
        callback(null);
    });
};

RiakPBC.prototype.disconnect = function () {
    if (!this.connected) return;
    this.client.end();
    this.connected = false;
    if (this.task) {
        this.queue.unshift(this.task);
        this.task = undefined;
    }
};

exports.createClient = function (options) {
    return new RiakPBC(options);
};

function writableStream() {
    var stream = through(function write(data) {
        this.queue(data);
    });
    return stream;
}
function parseMapReduceStream(rawStream) {
    var liner = new Stream.Transform({
        objectMode: true
    });

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


function parseMapRedStream() {

}
