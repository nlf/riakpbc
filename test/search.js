var Lab = require('lab');
var RiakPBC = require('../');

var after = Lab.after;
var before = Lab.before;
var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

var client = RiakPBC.createClient();


describe('search', function () {

    describe('callbacks', function () {

        before(function (done) {

            client.setBucket({
                bucket: '_test_search',
                props: {
                    search: true
                }
            }, function (err) {

                expect(err).to.not.exist;

                client.put({
                    bucket: '_test_search',
                    key: 'test',
                    content: {
                        value: '{"foo":"bar"}',
                        content_type: 'application/json'
                    }
                }, function (err) {

                    expect(err).to.not.exist;

                    done();
                });
            });
        });

        it('can search', function (done) {

            client.search({
                q: 'foo:bar',
                index: '_test_search'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.contain.keys(['docs', 'max_score']);
                expect(reply.docs).to.be.an('array');
                expect(reply.docs).to.have.length.gte(1);
                expect(reply.num_found).to.be.gte(1);

                done();
            });
        });
    });

    describe('streams', function () {

        before(function (done) {

            client.setBucket({
                bucket: '_test_search',
                props: {
                    search: true
                }
            }, function (err) {

                expect(err).to.not.exist;

                client.put({
                    bucket: '_test_search',
                    key: 'test',
                    content: {
                        value: '{"foo":"bar"}',
                        content_type: 'application/json'
                    }
                }, function (err) {

                    expect(err).to.not.exist;

                    done();
                });
            });
        });

        it('can search', function (done) {

            var search = client.search({
                q: 'foo:bar',
                index: '_test_search'
            });

            search.on('data', function (data) {

                expect(data).to.contain.keys(['docs', 'max_score']);
                expect(data.docs).to.be.an('array');
                expect(data.docs).to.have.length.gte(1);
                expect(data.num_found).to.be.gte(1);
            });

            search.on('end', done);
        });
    });
});
