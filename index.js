var net = require('net'),
    protobuf = require('protobuf.js'),
    butils = require('butils'),
    EventEmitter = require('events').EventEmitter,
    path = require('path'),
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
    self.client.on('end', self.disconnect);
    self.client.on('error', self.disconnect);
    self.paused = false;
    self.queue = [];
    var mc, reply = {}, resBuffers = [], numBytesAwaiting = 0;

    function splitPacket(pkt) {
        var pos = 0, len;
        if (numBytesAwaiting > 0) {
            len = Math.min(pkt.length, numBytesAwaiting);
            var oldBuf = resBuffers[resBuffers.length - 1];
            var newBuf = new Buffer(oldBuf.length + len);
            oldBuf.copy(newBuf, 0);
            pkt.slice(0, len).copy(newBuf, oldBuf.length);
            resBuffers[resBuffers.length - 1] = newBuf;
            pos = len;
            numBytesAwaiting -= len;
        } else {
            resBuffers = [];
        }
        while (pos < pkt.length) {
            len = butils.readInt32(pkt, pos);
            numBytesAwaiting = len + 4 - pkt.length;
            resBuffers.push(pkt.slice(pos + 4, Math.min(pos + len + 4, pkt.length)));
            pos += len + 4;
        }
    }

    self.client.on('data', function (chunk) {
        var err, response, packet;

        splitPacket(chunk);
        if (numBytesAwaiting > 0) {
            return;
        }

        for (var i = 0, l = resBuffers.length; i < l; i++) {
            packet = resBuffers[i];
            mc = messageCodes['' + packet[0]];

            response = self.translator.decode(mc, packet.slice(1));
            if (response.content && Array.isArray(response.content)) {
                response.content.map(function (item) {
                    if (item.value && item.content_type) {
                        if (item.content_type.match(/^(text\/\*)|(application\/json)$/)) item.value = item.value.toString();
                    }
                    return item;
                });
            }

            if (response.errmsg) {
                err = new Error(response.errmsg);
                err.code = response.errcode;
            }

            if (self.task.emitter && !response.done) {
                if (err) response = undefined;
                self.task.emitter.emit('data', err, response);
            }

            reply = _merge(reply, response);
        }

        if (!self.task.expectMultiple || reply.done || mc === 'RpbErrorResp') {
            if (err) reply = undefined;

            var cb = self.task.callback;
            var emitter = self.task.emitter;
            self.task = undefined;
            if (emitter) {
                emitter.emit('end', err, response);
            } else {
                cb(err, reply);
            }
            mc = undefined;
            reply = {};
            self.paused = false;
            err = undefined;
            nextTick(self.processNext);
        }
    });

    self.processNext = function () {
        if (self.queue.length && !self.paused) {
            self.paused = true;
            self.connect(function (err) {
                self.task = self.queue.shift();
                if (err) return self.task.callback(err);
                self.client.write(self.task.message);
            });
        }
    };
}

function _merge(obj1, obj2) {
    var obj = {};
    if (obj2.hasOwnProperty('phase')) {
        obj = obj1;
        if (obj[obj2.phase] === undefined) obj[obj2.phase] = [];
        obj[obj2.phase] = obj[obj2.phase].concat(JSON.parse(obj2.response));
    } else {
        [obj1, obj2].forEach(function (old) {
            Object.keys(old).forEach(function (key) {
                if (!old.hasOwnProperty(key)) return;
                if (Array.isArray(old[key])) {
                    if (!obj[key]) obj[key] = [];
                    obj[key] = obj[key].concat(old[key]);
                } else {
                    obj[key] = old[key];
                }
            });
        });
    }
    return obj;
}

RiakPBC.prototype.makeRequest = function (type, data, callback, expectMultiple, streaming) {
    var self = this,
        buffer = this.translator.encode(type, data),
        message = [],
        emitter;

    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
    }

    if (streaming) emitter = new EventEmitter();
    butils.writeInt32(message, buffer.length + 1);
    butils.writeInt(message, messageCodes[type], 4);
    message = message.concat(buffer);
    self.queue.push({ message: new Buffer(message), callback: callback, expectMultiple: expectMultiple, emitter: emitter });
    nextTick(self.processNext);
    return emitter;
};

RiakPBC.prototype.getBuckets = function (callback) {
    this.makeRequest('RpbListBucketsReq', null, callback);
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
    return this.makeRequest('RpbMapRedReq', params, callback, true, streaming);
};


RiakPBC.prototype.getCounter = function (params, callback) {
    this.makeRequest('RpbCounterGetReq', params, callback);
};


RiakPBC.prototype.updateCounter = function (params, callback) {
    this.makeRequest('RpbCounterUpdateReq', params, callback);
};

RiakPBC.prototype.getIndex = function (params, callback, streaming) {
    if (typeof streaming === 'function') {
        callback = streaming;
        streaming = false;
    }

    if (streaming) {
        var emitter = new EventEmitter();
        this.makeRequest('RpbIndexReq', params, callback, true, emitter);
        return emitter;
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
