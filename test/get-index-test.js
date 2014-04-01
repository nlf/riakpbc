var Lab = require('lab');
var expect = Lab.expect;
var describe = Lab.experiment;
var it = Lab.test;
var before = Lab.before;
var after = Lab.after;

var _ = require('lodash-node');
var inspect = require('eyespect').inspector();
var q = require('q');
var sinon = require('sinon');

var riakpbc = require('../index');
var client = riakpbc.createClient({ host: 'localhost', port: 8087 });

var numRows = 400;
var keysSaved = [];
describe('getIndex', function getIndexSuite() {
    before(function beforeBlock(done) {
        var promise = connectClient();
        promise.nodeify(done);
    });

    after(function afterBlock(done) {
        deleteKeysSaved(done);
    });

    describe('given a range of integer keys', function binaryKey() {
        var bucket = 'integer_range_test_bucket';
        var indexKey = 'integer_range_test_2i_key_int';

        before(function beforeBlock(done) {
            var promise = setupFixtures();
            promise.nodeify(done);
        });

        it('should get streaming range response in sorted order', function streamingRange(done) {
            var queryOpts = {
                qtype: 1, // range query type
                range_min: 0,
                range_max: 999999,
                index: indexKey,
                bucket: bucket,
                pagination_sort: true
            };
            var numKeys = 0;
            var readStream = client.getIndex(queryOpts);
            expect(readStream).to.exist;
            var dataHandlerSpy = sinon.spy(dataHandler);
            readStream.on('data', dataHandlerSpy);
            readStream.on('end', endHandler);
            var prev;

            function endHandler() {
                expect(numKeys, 'wrong number of keys found').to.equal(numRows);
                expect(dataHandlerSpy.callCount).to.be.above(1);
                done();
            }

            function dataHandler(data) {
                expect(data).to.exist;
                expect(data).to.be.an('object');
                expect(data).to.have.ownProperty('keys');
                var keys = data.keys;
                numKeys += keys.length;
                keys.forEach(validateKeyOrder);

                function validateKeyOrder(key) {
                    expect(key).to.be.a('string');
                    if (!prev) {
                        prev = key;
                        return;
                    }
                    expect(key).to.be.above(prev);
                }
            }
        });

        function setupFixtures(cb) {
            var range = _.range(0, numRows);
            var promise = q.all(range.map(createRow));
            return promise;
        }

        function createRow(id) {
            var key = [id, 'key'].join('_');
            var value = [id, 'value'].join('_');
            var content = {
                value: value,
                content_type: 'text/plain'
            };
            var bin_index = {
                key: indexKey,
                value: id
            };
            var indexes = [];
            indexes.push(bin_index);
            content.indexes = indexes;
            var saveOpts = {
                bucket: bucket,
                content: content,
                key: key
            };

            var promise = q.ninvoke(client, 'put', saveOpts);
            return promise.then(addKey);

            function addKey() {
                var item = {
                    bucket: bucket,
                    key: key
                };
                keysSaved.push(item);
            }

        }
    });

    describe('given a range of binary keys', function binaryKey() {
        var bucket = 'binary_range_test_bucket';
        var indexKey = 'binary_range_test_2i_key_bin';

        before(function beforeBlock(done) {
            var promise = setupFixtures();
            promise.nodeify(done);
        });

        it('should get streaming range response in sorted order', function streamingRange(done) {
            var queryOpts = {
                qtype: 1, // range query type
                range_min: '!',
                range_max: '~',
                index: indexKey,
                bucket: bucket,
                pagination_sort: true
            };
            var numKeys = 0;
            var readStream = client.getIndex(queryOpts);
            expect(readStream).to.exist;
            var dataHandlerSpy = sinon.spy(dataHandler);
            readStream.on('data', dataHandlerSpy);
            readStream.on('end', endHandler);
            var prev;

            function endHandler() {
                expect(numKeys).to.equal(numRows);
                expect(dataHandlerSpy.callCount, 'need more than one "data" event from stream').to.be.above(1);
                done();
            }

            function dataHandler(data) {
                expect(data).to.exist;
                expect(data).to.be.an('object');
                expect(data).to.have.ownProperty('keys');
                var keys = data.keys;
                numKeys += keys.length;
                keys.forEach(validateKeyOrder);

                function validateKeyOrder(key) {
                    expect(key).to.be.a('string');
                    if (!prev) {
                        prev = key;
                        return;
                    }
                    expect(key).to.be.above(prev);
                }
            }
        });

        it('should get streaming range response in sorted order when return_terms = true', function streamingRange(done) {
            var queryOpts = {
                qtype: 1, // range query type
                range_min: '!',
                range_max: '~',
                index: indexKey,
                return_terms: true,
                bucket: bucket,
                pagination_sort: true
            };
            var numKeys = 0;
            var readStream = client.getIndex(queryOpts);
            expect(readStream).to.exist;
            var dataHandlerSpy = sinon.spy(dataHandler);
            readStream.on('data', dataHandlerSpy);
            readStream.on('end', endHandler);
            var prev;

            function endHandler() {
                expect(numKeys).to.equal(numRows);
                expect(dataHandlerSpy.callCount, 'need more than one "data" event from stream').to.be.above(1);
                done();
            }

            function dataHandler(data) {
                expect(data).to.exist;
                expect(data).to.be.an('object');
                expect(data).to.have.ownProperty('results');
                var results = data.results;
                numKeys += results.length;
                results.forEach(validateKeyOrder);

                function validateKeyOrder(item) {
                    var key = item.key;
                    var value = item.value;
                    expect(key).to.be.a('string');
                    if (!prev) {
                        prev = key;
                        return;
                    }
                    expect(key).to.be.above(prev);
                }
            }
        });

        function setupFixtures(cb) {
            var range = _.range(0, numRows);
            var promise = q.all(range.map(createRow));
            return promise;
        }

        function createRow(id) {
            var key = [id, 'key'].join('_');
            var value = [id, 'value'].join('_');
            var content = {
                value: value,
                content_type: 'text/plain'
            };
            var bin_index = {
                key: indexKey,
                value: [id, 'index', 'value'].join('_')
            };
            var indexes = [];
            indexes.push(bin_index);
            content.indexes = indexes;
            var saveOpts = {
                bucket: bucket,
                content: content,
                key: key
            };

            var promise = q.ninvoke(client, 'put', saveOpts);
            return promise.then(addKey);

            function addKey() {
                var item = {
                    bucket: bucket,
                    key: key
                };
                keysSaved.push(item);
            }
        }
    });
});

function createClient() {
    var client = riakpbc.createClient({
        host: 'localhost',
        port: 7087
    });
    return client;
}

function connectClient() {
    var promise = q.ninvoke(client, 'connect');
    return promise;
}

function deleteKeysSaved(cb) {
    var promises = keysSaved.map(deleteKey);
    var promise = q.all(promises).nodeify(cb);
}

function deleteKey(item) {
    var bucket = item.bucket;
    var deleteOpts = {
        bucket: item.bucket,
        key: item.key
    };
    var promise = q.ninvoke(client, 'del', deleteOpts);
    return promise.then(function logDelete() {
        keysSaved.pop();
    });
}
