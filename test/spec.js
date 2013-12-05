var riakpbc = require('../index'),
    expect = require('chai').expect,
    client = riakpbc.createClient(),
    sinon = require('sinon'),
    async = require('async');

exports.setClientId = function (test) {
    client.setClientId({ client_id: 'testrunner' }, function (err, reply) {
        test.equal(err, undefined);
        test.done();
    });
};

exports.getClientId = function (test) {
    client.getClientId(function (err, reply) {
        test.equal(err, undefined);
        test.equal(reply.client_id, 'testrunner');
        test.done();
    });
};

exports.ping = function (test) {
    client.ping(function (err, reply) {
        test.equal(err, undefined);
        test.done();
    });
};

exports.getServerInfo = function (test) {
    client.getServerInfo(function (err, reply) {
        test.equal(err, undefined);
        test.notEqual(reply.node, undefined);
        test.notEqual(reply.server_version, undefined);
        test.done();
    });
};

exports.put = function (test) {
    client.put({ bucket: 'test', key: 'test', content: { value: '{"test":"data"}', content_type: 'application/json', indexes: [{ key: 'test_bin', value: 'test' }] } }, function (err, reply) {
        test.equal(err, undefined);
        test.done();
    });
};


exports.putVclock = function (test) {
    var options = { bucket: 'test', key: 'test-vclock', content: { value: '{"test":"data"}', content_type: 'application/json' }, return_body: true };
    client.put(options, function (err, reply) {
        test.equal(err, undefined);
        var options = { bucket: 'test', key: 'test-vclock', content: { value: '{"test":"data"}', content_type: 'application/json' }, return_body: true };
        options.vclock = reply.vclock;
        client.put(options, function (err, reply) {
            test.equal(err, undefined, err && err.toString());
            test.done();
        });
    });
};

exports.putIndex = function (test) {
    var indexes = [{ key: 'key1_bin', value: 'value1' }, { key: 'key2_bin', value: 'value2' }],
        options = { bucket: 'test', key: 'test-put-index', content: { value: '{"test":"data"}', content_type: 'application/json', indexes: indexes }, return_body: true };
    client.put(options, function (err, reply) {
        test.deepEqual(reply.content[0].indexes, indexes);
        test.done();
    });
};

exports.get = function (test) {
    client.get({ bucket: 'test', key: 'test' }, function (err, reply) {
        test.equal(err, undefined);
        test.ok(Array.isArray(reply.content));
        test.equal(reply.content.length, 1);
        test.deepEqual(reply.content[0].value, {test: "data"});
        test.done();
    });
};

exports.putLarge = function (test) {
    var value = {}, i;
    for (i = 0; i < 5000; i += 1) {
        value['test_key_' + i] = 'test_value_' + i;
    }
    client.put({ bucket: 'test', key: 'test-large', content: { value: JSON.stringify(value), content_type: 'application/json' }}, function (err, reply) {
        test.equal(err, undefined);
        test.done();
    });
};

exports.getLarge = function (test) {
    var value = {}, i;
    for (i = 0; i < 5000; i += 1) {
        value['test_key_' + i] = 'test_value_' + i;
    }
    client.get({ bucket: 'test', key: 'test-large' }, function (err, reply) {
        test.equal(err, undefined);
        test.ok(Array.isArray(reply.content));
        test.equal(reply.content.length, 1);
        test.deepEqual(reply.content[0].value, value);
        test.done();
    });
};

exports.getIndex = function (test) {
    client.getIndex({ bucket: 'test', index: 'test_bin', qtype: 0, key: 'test' }, function (err, reply) {
        test.equal(err, undefined);
        test.ok(Array.isArray(reply.keys));
        test.equal(reply.keys[0], 'test');
        test.done();
    });
};

exports.getBuckets = function (test) {
    client.getBuckets(function (err, reply) {
        test.equal(err, undefined);
        test.ok(Array.isArray(reply.buckets));
        test.done();
    });
};

exports.getBucket = function (test) {
    client.getBucket({ bucket: 'test' }, function (err, reply) {
        test.equal(err, undefined);
        test.equal(typeof reply.props, 'object');
        test.equal(typeof reply.props.n_val, 'number');
        test.equal(typeof reply.props.allow_mult, 'boolean');
        test.done();
    });
};

exports.setBucket = function (test) {
    client.setBucket({ bucket: 'test', props: { allow_mult: true, n_val: 3 } }, function (err, reply) {
        test.equal(err, undefined);
        test.done();
    });
};

exports.getKeys = function (test) {
    client.getKeys({ bucket: 'test' }, function (err, reply) {
        test.equal(err, undefined);
        test.ok(Array.isArray(reply.keys));
        var len = reply.keys.length;
        reply.keys = reply.keys.filter(function (key) {
            return (key.toString() === 'test' || key.toString() === 'test-large' || key.toString() === 'test-vclock' || key.toString() === 'test-put-index');
        });
        test.equal(reply.keys.length, len);
        test.equal(reply.done, true);
        test.done();
    });
};

exports.getKeysStream = function (test) {
    var streaming = true;
    var keysFound = 0;
    var readStream = client.getKeys({ bucket: 'test' }, streaming);
    readStream.on('data', dataHandler);
    readStream.on('end', endHandler);

    function dataHandler(reply) {
        test.ok(Array.isArray(reply.keys));
        var len = reply.keys.length;
        reply.keys = reply.keys.filter(function (key) {
            return (key.toString() === 'test' || key.toString() === 'test-large' || key.toString() === 'test-vclock' || key.toString() === 'test-put-index');
        });
        keysFound += len;
        test.equal(reply.keys.length, len);
    }

    function endHandler() {
        test.ok(keysFound > 0, 'no keys found');
        test.done();
    }

};

exports.mapred = function (test) {
    var request = {
        inputs: [['test', 'test']],
        query: [
            {
                map: {
                    source: 'function (v) { return [[v.bucket, v.key]]; }',
                    language: 'javascript',
                    keep: true
                }
            },
            {
                map: {
                    name: 'Riak.mapValuesJson',
                    language: 'javascript',
                    keep: true
                }
            }
        ]
    };
    client.mapred({ request: JSON.stringify(request), content_type: 'application/json' }, function (err, reply) {
        test.equal(err, undefined);
        test.ok(Array.isArray(reply[0]));
        test.ok(Array.isArray(reply[0][0]));
        test.equal(reply[0][0][0], 'test');
        test.equal(reply[0][0][1], 'test');
        test.ok(Array.isArray(reply[1]));
        test.equal(typeof reply[1][0], 'object');
        test.equal(reply[1][0].test, 'data');
        test.equal(reply.done, true);
        test.done();
    });
};

exports.mapredStream = function (test) {
    var request = {
        inputs: [['test', 'test']],
        query: [
            {
                map: {
                    source: 'function (v) { return [[v.bucket, v.key]]; }',
                    language: 'javascript',
                    keep: false
                }
            },
            {
                map: {
                    name: 'Riak.mapValuesJson',
                    language: 'javascript',
                    keep: true
                }
            }
        ]
    };
    var readStream = client.mapred({ request: JSON.stringify(request), content_type: 'application/json' }, true);
    var dataHandlerSpy = sinon.spy(dataHandler);
    readStream.on('data', dataHandlerSpy);
    readStream.on('end', endHandler);

    function endHandler() {
        test.equal(dataHandlerSpy.callCount, 1, 'wrong number of data events');
        test.done();
    }

    function dataHandler(reply) {
        test.ok(typeof reply, 'object');
        var keys = Object.keys(reply);
        var key = keys[0];
        var value = reply[key];

        test.equal(key, 'test');
        test.equal(value, 'data');
    }

};


exports.search = function (test) {
    client.search({ index: 'test', q: 'test:data' }, function (err, reply) {
        test.notEqual(reply, undefined);
        test.done();
    });
};


exports.counters = function (test) {
    var msg = 'error updating counter';
    client.updateCounter({ bucket: 'test', key: 'counter', amount: 3  }, function (err, reply) {
        expect(err, msg).to.not.exist;
        test.notEqual(reply, undefined);
        client.getCounter({ bucket: 'test', key: 'counter' }, function (err, reply) {
            expect(err, msg).to.not.exist;
            test.notEqual(reply, undefined);
            test.equal(reply.value, 3);
            client.updateCounter({ bucket: 'test', key: 'counter', amount: 100, returnvalue: true }, function (err, reply) {
                expect(err, msg).to.not.exist;
                test.notEqual(reply, undefined);
                test.equal(reply.value, 103);
                client.updateCounter({ bucket: 'test', key: 'counter', returnvalue: true, amount: -100 }, function (err, reply) {
                    expect(err, msg).to.not.exist;
                    test.notEqual(reply, undefined);
                    test.equal(reply.value, 3);
                    test.done();
                });
            });
        });
    });
};

exports.secondaryIndexPaging = function (test) {
    var ids = [0, 1, 2, 3, 4, 5, 6],
        make = function (id, cb) {
            var key = 'test-paging-' + id,
                payload = { value: id },
                indexes = [{ key: 'value_bin', value: String(id) }],
                request = {
                    bucket: 'test',
                    key: key,
                    content_type: 'application/json',
                    content: {value: JSON.stringify(payload), indexes: indexes}
                };
            client.put(request, function (err, reply) {
                test.notEqual(reply, undefined);
                test.equal(err, undefined);
                cb();
            });
        },
        remove = function (id, cb) {
            client.del({ bucket: 'test', key: 'test-paging-' + id }, function (err, reply) {
                test.notEqual(reply, undefined);
                test.equal(err, undefined);
                cb();
            });
        };

    async.each(ids, make, function (err) {
        var cursor;

        test.equal(err, undefined);
        client.getIndex({ bucket: 'test', index: 'value_bin', qtype: 1, range_min: '0', range_max: '9', max_results: 3 }, function (err, reply) {
            test.notEqual(reply, undefined);
            test.notEqual(reply.keys, undefined);
            test.notEqual(reply.continuation, undefined);
            test.equal(reply.keys.length, 3);
            cursor = reply.continuation;

            client.getIndex({ bucket: 'test', index: 'value_bin', qtype: 1, range_min: '0', range_max: '9', max_results: 3, continuation: cursor }, function (err, reply) {
                test.notEqual(reply, undefined);
                test.notEqual(reply.keys, undefined);
                test.notEqual(reply.continuation, undefined);
                test.equal(reply.keys.length, 3);
                cursor = reply.continuation;

                client.getIndex({ bucket: 'test', index: 'value_bin', qtype: 1, range_min: '0', range_max: '9', max_results: 3, continuation: cursor }, function (err, reply) {
                    test.notEqual(reply, undefined);
                    test.notEqual(reply.keys, undefined);
                    test.equal(reply.continuation, undefined);
                    test.equal(reply.keys.length, 1);

                    async.each(ids, remove, function (err) {
                        test.equal(err, undefined);
                        test.done();
                    });
                });
            });
        });
    });
};


exports.resetBucket = function (test) {
    client.resetBucket({ bucket: 'test' }, function (err, reply) {
        test.notEqual(reply, undefined);
        client.getBucket({ bucket: 'test' }, function (err, reply) {
            test.notEqual(reply, undefined);
            test.equal(reply.props.allow_mult, false);
            test.done();
        });
    });
};


exports.del = function (test) {
    // Uncomment the next line and the disconnect line below
    // for cleanup of failed tests.
    //
    //var client = require('../index').createClient();

    client.del({ bucket: 'test', key: 'test' }, function (err, reply) {
        test.equal(err, undefined);
        client.del({ bucket: 'test', key: 'test-large' }, function (err, reply) {
            test.equal(err, undefined);
            client.del({ bucket: 'test', key: 'test-vclock' }, function (err, reply) {
                test.equal(err, undefined);
                client.del({ bucket: 'test', key: 'test-put-index' }, function (err, reply) {
                    test.equal(err, undefined);
                    client.del({ bucket: 'test', key: 'counter' }, function (err, reply) {
                        test.equal(err, undefined);
                        //client.disconnect();
                        test.done();
                    });
                });
            });
        });
    });
};

exports.errorResponse = function (test) {
    client.put({ key: 'testing' }, function (err, reply) {
        test.notEqual(err, undefined);
        test.done();
    });
};

exports.disconnect = function (test) {
    client.disconnect();
    test.done();
};

exports.connectTimeout = function (test) {
    var client = riakpbc.createClient({ port: 1337 });
    client.connect(function (err) {
        test.equal(err.message, 'Connection timeout');

        client.getBuckets(function (err, reply) {
            test.equal(err.message, 'Connection timeout');
            test.done();
        });
    });
};
