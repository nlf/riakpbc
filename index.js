var Stream = require('stream');
var Quorum = require('./lib/quorum');
var Connection = require('./lib/connection');
var Pool = require('generic-pool').Pool;
var Balancer = require('./lib/balancer');
var Options = require('./lib/options');

function RiakPBC(options) {

    var self = this;

    Options.validate(options, function (err, options) {

        self.balancer = new Balancer(options);
        self.pool = Pool({
            name: 'riakpbc',
            max: options.maxConnections,
            min: options.minConnections,
            idleTimeoutMillis: options.idleTimeout,
            create: function (callback) {

                var client = new Connection(self.balancer.next());
                client.connect(function (err) {

                    callback(err, client);
                });
            },
            destroy: function (client) {

                client.disconnect();
            }
        });
    });
}

exports.FieldType = {
    Counter: 1,
    Set: 2,
    Register: 3,
    Flag: 4,
    Map: 5
};

exports.Flag = {
    Enable: 1,
    Disable: 2
};

exports.DataType = {
    Counter: 1,
    Set: 2,
    Map: 3
};

exports.IndexType = {
    Exact: 0,
    Range: 1
};

RiakPBC.prototype.makeRequest = function (options) {

    var self = this;
    var stream, callback;

    if (typeof options.callback === 'function') {
        callback = function (err, reply) {
            process.nextTick(function () {
                options.callback(err, reply);
            });
        };

        if (process.domain) {
            callback = process.domain.bind(callback);
        }
    }
    else {
        stream = writableStream();
    }

    if (options.params && options.params.props) {
        options.params.props = Quorum.convert(options.params.props);
    }

    self.pool.acquire(function (err, client) {

        if (err) {
            if (callback) {
                callback(err);
            }
            else {
                stream.emit('error', err);
            }

            return self.pool.release(client);
        }

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

RiakPBC.prototype.setBucketType = function (params, callback) {

    return this.makeRequest({
        type: 'RpbSetBucketTypeReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getBucketType = function (params, callback) {

    return this.makeRequest({
        type: 'RpbGetBucketTypeReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.putCrdt = function (params, callback) {

    return this.makeRequest({
        type: 'DtUpdateReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getCrdt = function (params, callback) {

    return this.makeRequest({
        type: 'DtFetchReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getKeys = function (params, callback) {

    params.stream = true;

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

RiakPBC.prototype.getIndex = function (params, callback) {

    params.stream = true;

    return this.makeRequest({
        type: 'RpbIndexReq',
        params: params,
        expectMultiple: true,
        callback: callback
    });
};

RiakPBC.prototype.createSearchSchema = function (params, callback) {

    return this.makeRequest({
        type: 'RpbYokozunaSchemaPutReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getSearchSchema = function (params, callback) {

    return this.makeRequest({
        type: 'RpbYokozunaSchemaGetReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.createSearchIndex = function (params, callback) {

    return this.makeRequest({
        type: 'RpbYokozunaIndexPutReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.getSearchIndex = function (params, callback) {

    return this.makeRequest({
        type: 'RpbYokozunaIndexGetReq',
        params: params,
        callback: callback
    });
};

RiakPBC.prototype.deleteSearchIndex = function (params, callback) {

    return this.makeRequest({
        type: 'RpbYokozunaIndexDeleteReq',
        params: params,
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
