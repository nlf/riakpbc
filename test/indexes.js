var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

describe('Secondary Indexes', function () {

    describe('(callbacks)', function () {

        it('can put a key with an index', function (done) {

            client.put({
                bucket: '_test_indexes',
                key: 'meat',
                content: {
                    value: 'bacon',
                    content_type: 'text/plain',
                    indexes: [{
                        key: 'delicious_bin',
                        value: 'yes'
                    }]
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.contain.keys(['content', 'vclock']);
                expect(reply.content).to.be.an('array');
                expect(reply.content[0]).to.contain.keys(['value', 'content_type', 'indexes']);
                expect(reply.content[0].indexes).to.be.an('array');
                expect(reply.content[0].indexes).to.have.length(1);
                expect(reply.content[0].indexes[0]).to.deep.equal({
                    key: 'delicious_bin',
                    value: 'yes'
                });

                done();
            });
        });

        it('can find a key by its index with an exact match', function (done) {

            client.getIndex({
                bucket: '_test_indexes',
                index: 'delicious_bin',
                key: 'yes',
                qtype: 0
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.have.key('keys');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys).to.have.length.gte(1);

                done();
            });
        });

        it('can find a key by its index with a range', function (done) {

            client.getIndex({
                bucket: '_test_indexes',
                index: 'delicious_bin',
                range_min: 'yer',
                range_max: 'yet',
                qtype: 1
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.have.key('keys');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys).to.have.length.gte(1);

                done();
            });
        });

        after(function (done) {

            client.del({
                bucket: '_test_indexes',
                key: 'meat'
            }, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    describe('(streams)', function () {

        it('can put a key with an index', function (done) {

            var key = client.put({
                bucket: '_test_indexes',
                key: 'meat',
                content: {
                    value: 'bacon',
                    content_type: 'text/plain',
                    indexes: [{
                        key: 'delicious_bin',
                        value: 'yes'
                    }]
                },
                return_body: true
            });
            
            key.on('data', function (data) {

                expect(data).to.contain.keys(['content', 'vclock']);
                expect(data.content).to.be.an('array');
                expect(data.content[0]).to.contain.keys(['value', 'content_type', 'indexes']);
                expect(data.content[0].indexes).to.be.an('array');
                expect(data.content[0].indexes).to.have.length(1);
                expect(data.content[0].indexes[0]).to.deep.equal({
                    key: 'delicious_bin',
                    value: 'yes'
                });
            });
            
            key.on('end', done);
        });

        it('can find a key by its index with an exact match', function (done) {

            var keys = client.getIndex({
                bucket: '_test_indexes',
                index: 'delicious_bin',
                key: 'yes',
                qtype: 0
            });
            
            keys.on('data', function (data) {

                expect(data).to.have.key('keys');
                expect(data.keys).to.be.an('array');
                expect(data.keys).to.have.length.gte(1);
            });
            
            keys.on('end', done);
        });

        it('can find a key by its index with a range', function (done) {

            var keys = client.getIndex({
                bucket: '_test_indexes',
                index: 'delicious_bin',
                range_min: 'yer',
                range_max: 'yet',
                qtype: 1
            });
            
            keys.on('data', function (data) {

                expect(data).to.have.key('keys');
                expect(data.keys).to.be.an('array');
                expect(data.keys).to.have.length.gte(1);
            });
            
            keys.on('end', done);
        });

        after(function (done) {

            var key = client.del({
                bucket: '_test_indexes',
                key: 'meat'
            });

            key.resume();
            key.on('end', done);
        });
    });
});
