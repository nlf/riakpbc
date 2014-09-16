var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

describe('MapReduce', function () {

    describe('(callbacks)', function () {

        before(function (done) {

            client.put({
                bucket: '_test_mapred',
                key: 'test',
                content: {
                    value: 'test',
                    content_type: 'text/plain'
                }
            }, done);
        });

        it('can execute a mapreduce query', function (done) {

            var request = {
                inputs: '_test_mapred',
                query: [{
                    map: {
                        name: 'Riak.mapValues',
                        language: 'javascript'
                    }
                }]
            };

            client.mapred({
                request: JSON.stringify(request),
                content_type: 'application/json'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('array');
                expect(reply).to.have.length.gte(1);
                expect(reply).to.contain('test');
                done();
            });
        });

        it('returns errors when mapreduce query is invalid', function (done) {

            var request = {
                inputs: 5
            };

            client.mapred({
                request: JSON.stringify(request),
                content_type: 'application/json'
            }, function (err, reply) {

                expect(err).to.exist;
                done();
            });
        });

        after(function (done) {

            client.del({
                bucket: '_test_mapred',
                key: 'test'
            }, done);
        });
    });

    describe('(streams)', function () {

        before(function (done) {

            client.put({
                bucket: '_test_mapred',
                key: 'test',
                content: {
                    value: 'test',
                    content_type: 'text/plain'
                }
            }).on('end', done).resume();
        });

        it('can execute a mapreduce query', function (done) {

            var request = {
                inputs: '_test_mapred',
                query: [{
                    map: {
                        name: 'Riak.mapValues',
                        language: 'javascript'
                    }
                }]
            };

            client.mapred({
                request: JSON.stringify(request),
                content_type: 'application/json'
            }).on('data', function (reply) {

                expect(reply).to.equal('test');
            }).on('end', done);
        });

        it('returns errors when mapreduce query is invalid', function (done) {

            var request = {
                inputs: 5
            };

            client.mapred({
                request: JSON.stringify(request),
                content_type: 'application/json'
            }).on('error', function (err) {

                expect(err).to.exist;
                done();
            });
        });

        after(function (done) {

            client.del({
                bucket: '_test_mapred',
                key: 'test'
            }).on('end', done).resume();
        });
    });
});
