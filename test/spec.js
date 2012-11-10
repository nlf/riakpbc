var client = require('../index').createClient();

exports.setClientId = function (test) {
    client.setClientId({ client_id: 'testrunner' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.done();
    });
};

exports.getClientId = function (test) {
    client.getClientId(function (reply) {
        test.equal(reply.errmsg, undefined);
        test.equal(reply.client_id, 'testrunner');
        test.done();
    });
};

exports.ping = function (test) {
    client.ping(function (reply) {
        test.equal(reply.errmsg, undefined);
        test.done();
    });
};

exports.getServerInfo = function (test) {
    client.getServerInfo(function (reply) {
        test.equal(reply.errmsg, undefined);
        test.notEqual(reply.node, undefined);
        test.notEqual(reply.server_version, undefined);
        test.done();
    });
};

exports.put = function (test) {
    client.put({ bucket: 'test', key: 'test', content: { value: '{"test":"data"}', content_type: 'application/json', indexes: [{ key: 'test_bin', value: 'test' }] } }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.done();
    });
};

exports.get = function (test) {
    client.get({ bucket: 'test', key: 'test' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.ok(Array.isArray(reply.content));
        test.equal(reply.content.length, 1);
        test.equal(reply.content[0].value, '{"test":"data"}');
        test.done();
    });
};

exports.getIndex = function (test) {
    client.getIndex({ bucket: 'test', index: 'test_bin', qtype: 0, key: 'test' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.ok(Array.isArray(reply.keys));
        test.equal(reply.keys[0], 'test');
        test.done();
    });
};

exports.getBuckets = function (test) {
    client.getBuckets(function (reply) {
        test.equal(reply.errmsg, undefined);
        test.ok(Array.isArray(reply.buckets));
        test.done();
    });
};

exports.getBucket = function (test) {
    client.getBucket({ bucket: 'test' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.equal(typeof reply.props, 'object');
        test.equal(typeof reply.props.n_val, 'number');
        test.equal(typeof reply.props.allow_mult, 'boolean');
        test.done();
    });
};

exports.setBucket = function (test) {
    client.setBucket({ bucket: 'test', props: { allow_mult: true, n_val: 3 } }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.done();
    });
};

exports.getKeys = function (test) {
    client.getKeys({ bucket: 'test' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.ok(Array.isArray(reply.keys));
        test.equal(reply.keys[0], 'test');
        test.equal(reply.done, true);
        test.done();
    });
};

exports.mapred = function (test) {
    var request = {
        inputs: 'test',
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
    client.mapred({ request: JSON.stringify(request), content_type: 'application/json' }, function (reply) {
        test.equal(reply.errmsg, undefined);
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

/*
 * this doesn't work for some weird damn reason...
exports.search = function (test) {
    client.search({ index: 'test', q: 'test:data' }, function (reply) {
        console.log(reply);
        test.done();
    });
}
*/

exports.del = function (test) {
    client.del({ bucket: 'test', key: 'test' }, function (reply) {
        test.equal(reply.errmsg, undefined);
        test.done();
    });
};

exports.disconnect = function (test) {
    client.disconnect();
    test.done();
};
