var Lab = require('lab');
var RiakPBC = require('../');

var after = Lab.after;
var before = Lab.before;
var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

var client = RiakPBC.createClient();

describe('mapreduce', function () {

    describe('callbacks', function () {

        before(function (done) {

            client.put({
                bucket: '_test_mapred',
                key: 'test',
                content: {
                    value: 'test',
                    content_type: 'text/plain'
                }
            }, function (err) {

                expect(err).to.not.exist;

                done();
            });
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
    });

    describe('streams', function () {

        before(function (done) {

            client.put({
                bucket: '_test_mapred',
                key: 'test',
                content: {
                    value: 'test',
                    content_type: 'text/plain'
                }
            }, function (err) {

                expect(err).to.not.exist;

                done();
            });
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

            var mapred = client.mapred({
                request: JSON.stringify(request),
                content_type: 'application/json'
            });

            mapred.on('data', function (data) {

                expect(data).to.equal('test');
            });

            mapred.on('end', done);
        });

        it('returns errors when mapreduce query is invalid', function (done) {

            var request = {
                inputs: 5
            };

            var mapred = client.mapred({
                request: JSON.stringify(request),
                content_type: 'application/json'
            });

            mapred.on('error', function (err) {

                expect(err).to.exist;
                done();
            });
        });
    });
});
