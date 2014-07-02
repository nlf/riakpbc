var Stream = require('stream');
var Quorum = require('./lib/quorum');
var Connection= require('./lib/connection');
var Pool = require('generic-pool').Pool;
var schema = require('./lib/schema');

function RiakPBC(options) {

    schema.validate(options, function (err, options) {

        this.pool = Pool({
            name: 'riakpbc',
            max: options.max_connections,
            min: options.min_connections,
            idleTimeoutMillis: options.idle_timeout,
            create: function (callback) {

                var client = new Connection(options);
                client.connect(function () {

                    callback(null, client);
                });
            },
            destroy: function (client) {

                client.disconnect();
            }
        });
    }.bind(this));
}

RiakPBC.prototype.makeRequest = function (options) {

    var self = this;
    var stream, callback;

    if (typeof options.callback === 'function') {
        callback = function (err, reply) {
            process.nextTick(function () {
                options.callback(err, reply);
            });
        };
    }
    else {
        stream = writableStream();
    }

    if (options.params && options.params.props) {
        options.params.props = Quorum.convert(options.params.props);
    }

    self.pool.acquire(function (err, client) {

        client.makeRequest({
            type: options.type,
            params: options.params,
            expectMultiple: options.expectMultiple,
            callback: callback,
            stream: stream
        }, function () {

            self.pool.release(client);
        });
    });

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

RiakPBC.prototype.getKeys = function (params, callback) {

    return this.makeRequest({
        type: 'RpbListKeysReq',
        params: params,
        expectMultiple: true,
        callback: callback
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

RiakPBC.prototype.mapred = function (params, callback) {

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

        callback(undefined, rows);
    }

    return parseMapReduceStream(this.makeRequest({
        type: 'RpbMapRedReq',
        params: params,
        callback: callback ? cb : undefined,
        expectMultiple: true
    }));
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

RiakPBC.prototype.getIndex = function (params, callback) {

    params.stream = true;

    return this.makeRequest({
        type: 'RpbIndexReq',
        params: params,
        expectMultiple: true,
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

RiakPBC.prototype.end = function (callback) {

    this.pool.drain(function () {

        this.pool.destroyAllNow(callback);
    }.bind(this));
};

exports.createClient = function (options) {

    return new RiakPBC(options);
};

function writableStream() {

    return new Stream.PassThrough({ objectMode: true });
}

function parseMapReduceStream(rawStream) {

    if (!rawStream) {
        return null;
    }

    var liner = new Stream.Transform({ objectMode: true });

    liner._transform = function (chunk, encoding, done) {

        var response = chunk.response;
        var json = JSON.parse(response);

        json.forEach(function (row) {

            liner.push(row);
        });

        done();
    };

    rawStream.on('error', function (err) {

        liner.emit('error', err);
    });

    rawStream.pipe(liner);
    return liner;
}
