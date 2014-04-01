var Lab = require('lab');
var expect = Lab.expect;
var describe = Lab.experiment;
var it = Lab.test;
var before = Lab.before;
var after = Lab.after;

var riakpbc = require('../index');
var inspect = require('eyespect').inspector();
var q = require('q');
var client = riakpbc.createClient();
var sinon = require('sinon');
var async = require('async');
var savedKeys = {};

describe('Client test', function () {

    after(function (done) {
        async.each(Object.keys(savedKeys), deleteKey, done);
    });

    it('setClientId', function (done) {
        client.setClientId({
            client_id: 'testrunner'
        }, function (err, reply) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('getClientId', function (done) {
        client.getClientId(function (err, reply) {
            expect(err).to.not.exist;
            expect(reply.client_id).to.equal('testrunner');
            done();
        });
    });

    it('ping', function (done) {
        client.ping(function (err, reply) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('getServerInfo', function (done) {
        client.getServerInfo(function (err, reply) {
            expect(err).to.not.exist;
            expect(reply.node).to.exist;
            expect(reply.server_version).to.exist;
            done();
        });
    });

    it('put', function (done) {
        var bucket = 'test';
        var valueObject = {
            test: 'data'
        };
        var indexes = [];
        indexes.push({
            key: 'test_bin',
            value: 'test'
        });

        var value = JSON.stringify(valueObject);
        var content = {
            value: value,
            content_type: 'application/json',
            indexes: indexes
        };

        var key = 'test';
        savedKeys[key] = bucket;

        var opts = {
            bucket: bucket,
            key: key,
            content: content,
            return_body: true
        };
        client.put(opts, function (err, reply) {
            expect(err).to.not.exist;
            var value = reply.content[0].value;
            expect(value).to.exist;
            expect(value).to.eql(valueObject);
            done();
        });
    });

    it('putVclock', function (done) {
        var key = 'test-vclock';
        var bucket = 'test';
        var value = '{"test":"data"}';
        var options = {
            bucket: bucket,
            key: key,
            content: {
                value: value,
                content_type: 'application/json'
            },
            return_body: true
        };
        savedKeys[key] = bucket;
        client.put(options, function (err, reply) {
            expect(err).to.not.exist;
            var options = {
                bucket: 'test',
                key: 'test-vclock',
                content: {
                    value: '{"test":"data"}',
                    content_type: 'application/json'
                },
                return_body: true
            };
            options.vclock = reply.vclock;
            client.put(options, function (err) {
                expect(err).to.not.exist;
                done();
            });
        });
    });

    describe('Secondary Index', function () {

        var bucket = 'test_secondary_index';
        var value = '{"test":"data"}';
        var keyValue = 'test_put_key';
        savedKeys[keyValue] = bucket;
        var binaryIndexKey = 'test_put_bin';
        var binaryIndexValue = 'value1';
        var integerIndexKey = 'test_put_int';
        var integerIndexValue = 20;


        it('putIndex', function (done) {
            var integerIndex = {
                key: integerIndexKey,
                value: integerIndexValue
            };
            var binaryIndex = {
                key: binaryIndexKey,
                value: binaryIndexValue
            };
            var indexes = [binaryIndex, integerIndex];
            var options = {
                bucket: bucket,
                key: keyValue,
                content: {
                    value: value,
                    content_type: 'application/json',
                    indexes: indexes
                },
                return_body: true
            };
            client.put(options, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                var replyIndexes = reply.content[0].indexes;
                expect(replyIndexes.length).to.eql(indexes.length);
                done();
            });
        });

        it('getIndex for single value', function (done) {
            var opts = {
                bucket: bucket,
                index: binaryIndexKey,
                qtype: 0,
                key: binaryIndexValue
            };
            client.getIndex(opts, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                expect(reply).to.have.ownProperty('keys');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys[0]).to.equal(keyValue);
                done();
            });
        });

        it('getIndex for binary range', function (done) {
            var opts = {
                bucket: bucket,
                index: binaryIndexKey,
                qtype: 1,
                range_min: '!',
                range_max: '~'
            };
            client.getIndex(opts, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                expect(reply).to.have.ownProperty('keys');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys[0]).to.equal(keyValue);
                done();
            });
        });

        it('getIndex streaming for binary range', function (done) {
            var opts = {
                bucket: bucket,
                index: binaryIndexKey,
                qtype: 1,
                range_min: '!',
                range_max: '~'
            };
            var readStream = client.getIndex(opts);
            var dataHandlerSpy = sinon.spy(dataHandler);
            readStream.on('data', dataHandlerSpy);
            readStream.on('end', endHandler);

            function dataHandler(reply) {
                expect(reply).to.exist;
                expect(reply).to.have.ownProperty('keys');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys[0]).to.equal(keyValue);
            }

            function endHandler() {
                expect(dataHandlerSpy.callCount).to.be.above(0);
                done();
            }
        });

        it('getIndex for integer range', function (done) {
            var opts = {
                bucket: bucket,
                index: integerIndexKey,
                qtype: 1,
                range_min: -99999,
                range_max: 99999
            };
            client.getIndex(opts, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                expect(reply).to.have.ownProperty('keys');
                expect(reply.keys).to.be.an('array');
                done();
            });
        });
    });


    it('get', function (done) {
        var opts = {
            bucket: 'test',
            key: 'test'
        };
        client.get(opts, cb);

        function cb(err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.exist;
            expect(reply.content).to.exist;
            expect(reply.content).to.be.an('array');
            expect(reply.content[0].value).to.eql({
                test: 'data'
            });
            done();
        }
    });

    it('putLarge', { timeout: 3000 }, function (done) {
        var bucket = 'test';
        var value = {}, i;
        for (i = 0; i < 5000; i += 1) {
            value['test_key_' + i] = 'test_value_' + i;
        }
        var key = 'test-large';
        var json = JSON.stringify(value);
        savedKeys[key] = bucket;
        var opts = {
            bucket: bucket,
            key: 'test-large',
            content: {
                value: json,
                content_type: 'application/json'
            }
        };
        client.put(opts, function (err) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('getLarge', function (done) {
        var value = {}, i;
        for (i = 0; i < 5000; i += 1) {
            value['test_key_' + i] = 'test_value_' + i;
        }
        client.get({
            bucket: 'test',
            key: 'test-large'
        }, function (err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.exist;
            expect(reply.content).to.exist;
            expect(reply.content).to.be.an('array');
            expect(reply.content[0].value).to.eql(value);
            done();
        });
    });

    it('getBuckets', function (done) {
        client.getBuckets(function (err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.have.ownProperty('buckets');
            expect(reply.buckets).to.be.an('array');
            done();
        });
    });


    it('getBucket', function (done) {
        client.getBucket({
            bucket: 'test'
        }, function (err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.have.ownProperty('props');
            var props = reply.props;
            expect(props).to.exist;
            expect(props).to.be.an('object');
            expect(props.n_val).to.be.a('number');
            expect(props.allow_mult).to.be.a('boolean');
            done();
        });
    });

    it('setBucket', function (done) {
        var opts = {
            bucket: 'test',
            props: {
                allow_mult: true,
                n_val: 3
            }
        };
        client.setBucket(opts, function (err, reply) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('setBucket converts quorum values', function (done) {
        var opts = {
            bucket: 'test',
            props: {
                r: 'quorum',
                w: 'all'
            }
        };
        client.setBucket(opts, function (err, reply) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('getBucket converts quorum values', function (done) {
        client.getBucket({ bucket: 'test' }, function (err, reply) {
            expect(err).to.not.exist;
            expect(reply.props.r).to.equal('quorum');
            expect(reply.props.w).to.equal('all');
            done();
        });
    });

    it('getKeys', function (done) {
        client.getKeys({
            bucket: 'test'
        }, function (err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.exist;
            expect(reply).to.have.ownProperty('keys');
            expect(reply.keys).to.be.an('array');
            expect(reply.keys.length).to.be.above(0);
            done();
        });
    });


    it('getKeys streaming', function (done) {
        var keysFound = 0;
        var readStream = client.getKeys({
            bucket: 'test'
        });
        readStream.on('data', dataHandler);
        readStream.on('end', endHandler);

        function dataHandler(reply) {
            expect(reply).to.exist;
            expect(reply).to.have.ownProperty('keys');
            expect(reply.keys).to.be.an('array');
            expect(reply.keys.length, 'no keys found').to.be.above(0);
            keysFound += reply.keys.length;
        }

        function endHandler() {
            expect(keysFound).to.be.above(0, 'no keys found');
            done();
        }
    });

    it('mapred', function (done) {
        var mapOpts = {
            map: {
                source: 'function (v) { return [[v.bucket, v.key]]; }',
                language: 'javascript',
                keep: false
            }
        };

        var map2Opts = {
            map: {
                name: 'Riak.mapValuesJson',
                language: 'javascript',
                keep: true
            }
        };
        var query = [mapOpts, map2Opts];
        var request = {
            inputs: [['test', 'test']],
            query: query
        };
        var opts = {
            request: JSON.stringify(request),
            content_type: 'application/json',
        };
        client.mapred(opts, callback);

        function callback(err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.be.an('array');
            expect(reply.length).to.equal(1);
            var row = reply[0];
            var keys = Object.keys(row);
            expect(keys.length).to.equal(1);
            var key = keys[0];
            var value = row[key];
            expect(key).to.equal('test');
            expect(value).to.equal('data');
            done();
        }
    });

    it('mapred streaming', function (done) {
        var mapOpts = {
            map: {
                source: 'function (v) { return [[v.bucket, v.key]]; }',
                language: 'javascript',
                keep: false
            }
        };

        var map2Opts = {
            map: {
                name: 'Riak.mapValuesJson',
                language: 'javascript',
                keep: true
            }
        };
        var query = [mapOpts, map2Opts];
        var request = {
            inputs: [['test', 'test']],
            query: query
        };
        var opts = {
            request: JSON.stringify(request),
            content_type: 'application/json',
        };
        var readStream = client.mapred(opts);

        var dataHandlerSpy = sinon.spy(dataHandler);
        readStream.on('data', dataHandlerSpy);
        readStream.on('end', endHandler);

        function endHandler() {
            expect(dataHandlerSpy.callCount, 'wrong number of data events').to.equal(1);
            done();
        }

        function dataHandler(reply) {
            expect(reply).to.be.an('object');
            var keys = Object.keys(reply);
            expect(keys.length).to.equal(1);
            var key = keys[0];
            var value = reply[key];
            expect(key).to.equal('test');
            expect(value).to.equal('data');
        }
    });

    it('counters', function (done) {
        var currentValue = 3;
        var bucket = 'test';
        var key = 'counter';
        savedKeys[key] = bucket;
        var setOpts = {
            bucket: bucket,
            key: key,
            amount: currentValue
        };
        var getOpts = {
            bucket: 'test',
            key: 'counter'
        };
        var promise;
        try {
            promise = q.ninvoke(client, 'updateCounter', setOpts);
        } catch (err) {
            failHandler(err);
        }
        promise.then(function (reply) {
            expect(reply).to.exist;
        }).then(function () {
            var promise = q.ninvoke(client, 'getCounter', getOpts);
            return promise;
        }).then(function (reply) {
            expect(reply).to.exist;
            expect(reply.value.toNumber()).to.equal(currentValue);
        }).then(function () {
            setOpts.amount = 100;
            setOpts.returnvalue = true;
            currentValue += setOpts.amount;
            var promise = q.ninvoke(client, 'updateCounter', setOpts);
            return promise;
        }).then(function (reply) {
            expect(reply.value.toNumber()).to.equal(currentValue);
        }).then(function () {
            setOpts.amount = -100;
            currentValue += setOpts.amount;
            var promise = q.ninvoke(client, 'updateCounter', setOpts);
            return promise;
        }).then(function (reply) {
            expect(reply.value.toNumber()).to.equal(currentValue);
        }).then(function () {
            done();
        }).fail(failHandler).done();

        function failHandler(err) {
            console.log('counter test err');
            console.dir(err);
            throw err;
        }
    });


    it('resetBucket', function (done) {
        client.resetBucket({
            bucket: 'test'
        }, function (err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.exist;
            client.getBucket({
                bucket: 'test'
            }, function (err, reply) {
                expect(reply).to.exist;
                expect(reply.props.allow_mult).to.be.false;
                done();
            });
        });
    });

    it('del', function (done) {
        var client = require('../index').createClient();
        client.del({
            bucket: 'test',
            key: 'test'
        }, function (err, reply) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('errorResponse', function (done) {
        client.put({
            key: 'testing'
        }, function (err, reply) {
            expect(err, 'should pass error to callback').to.exist;
            done();
        });
    });

    it('disconnect', function (done) {
        client.disconnect();
        done();
    });

    it('prevents reconnections', function (done) {
        client.ping(function (err) {
            expect(err, 'should error after disconnect').to.exist;
            // create a new client so it will automatically connect again
            client = riakpbc.createClient();
            done();
        });
    });

    describe('time sensitive', function () {
        it('connectionTimeout', function (done) {
            var client = riakpbc.createClient({
                port: 1337,
                timeout: 1
            });
            client.connect(connectCB);

            function connectCB(err) {
                expect(err).to.exist;
                expect(err.message).to.equal('Connection timeout');
                client.getBuckets(function (err, reply) {
                    expect(err).to.exist;
                    expect(err.message).to.equal('Connection timeout');
                    done();
                });
            }
        });
    });

    it('secondaryIndexPaging', function (done) {
        var bucket = 'paging_test';
        var ids = [0, 1, 2, 3, 4, 5, 6];
        function saveRow(id, cb) {
            var indexRow = {
                key: 'value_bin',
                value: String(id)
            };
            var key = 'test-paging-' + id;
            var payload = {
                value: id
            };
            var indexes = [indexRow];
            var request = {
                bucket: bucket,
                key: key,
                content: {
                    content_type: 'application/json',
                    value: JSON.stringify(payload),
                    indexes: indexes
                }
            };

            savedKeys[key] = bucket;


            client.put(request, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                cb(err);
            });
        }

        async.eachSeries(ids, saveRow, function (err) {
            expect(err).to.not.exist;
            var cursor;

            client.getIndex({
                bucket: bucket,
                index: 'value_bin',
                qtype: 1,
                range_min: '0',
                range_max: '9',
                max_results: 3
            }, function (err, reply) {
                expect(err).not.exist;
                expect(reply).to.exist;
                expect(reply.keys, 'keys not set in reply').to.exist;
                expect(reply.continuation).to.exist;
                expect(reply.keys.length).to.equal(3);
                cursor = reply.continuation;

                client.getIndex({
                    bucket: bucket,
                    index: 'value_bin',
                    qtype: 1,
                    range_min: '0',
                    range_max: '9',
                    max_results: 3,
                    continuation: cursor
                }, function (err, reply) {
                    expect(err).not.exist;
                    expect(reply).to.exist;
                    expect(reply.keys).to.exist;
                    expect(reply.continuation).to.exist;
                    expect(reply.keys.length).to.equal(3);
                    cursor = reply.continuation;

                    client.getIndex({
                        bucket: bucket,
                        index: 'value_bin',
                        qtype: 1,
                        range_min: '0',
                        range_max: '9',
                        max_results: 3,
                        continuation: cursor
                    }, function (err, reply) {
                        expect(err).not.exist;
                        expect(reply).to.exist;
                        expect(reply.keys).to.exist;
                        expect(reply.continuation).to.not.exist;
                        expect(reply.keys.length).to.equal(1);
                        done();
                    });
                });
            });
        });
    });
    it('secondaryIndexPagingStreaming', function (done) {
        var bucket = 'paging_test';
        var ids = [0, 1, 2];
        function saveRow(id, cb) {
            var indexRow = {
                key: 'value_bin',
                value: String(id)
            };
            var key = 'test-paging-' + id;
            var payload = {
                value: id
            };
            var indexes = [indexRow];
            var request = {
                bucket: bucket,
                key: key,
                content: {
                    content_type: 'application/json',
                    value: JSON.stringify(payload),
                    indexes: indexes
                }
            };

            savedKeys[key] = bucket;


            client.put(request, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                cb(err);
            });
        }

        async.eachSeries(ids, saveRow, function (err) {
            expect(err).to.not.exist;
            var cursor, results = {};

            var stream = client.getIndex({
                bucket: bucket,
                index: 'value_bin',
                qtype: 1,
                range_min: '0',
                range_max: '3',
                max_results: 2
            });
            stream.on('data', function (reply) {
                expect(reply).to.exist;
                if (reply.continuation) {
                    results.continuation = reply.continuation;
                }
                results.keys = (results.keys || []).concat(reply.keys);
            });
            stream.on('end', function (reply) {
                expect(results.keys, 'keys not set in results').to.exist;
                expect(results.keys.length).to.equal(3);
                expect(results.continuation, 'continuation not set in end reply').to.exist;
                done();
            });
        });
    });
});

function deleteKey(key, cb) {
    var bucket = savedKeys[key];
    var deleteOpts = {
        key: key,
        bucket: bucket
    };
    client.del(deleteOpts, function (err) {
        if (err) {
            inspect(err, 'delete error');
        }
        cb(err);
    });
}
