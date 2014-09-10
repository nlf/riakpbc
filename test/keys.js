var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

describe('Keys', function () {

    describe('(callbacks)', function () {

        it('can write text to a key', function (done) {

            client.put({
                bucket: '_test_keys',
                key: 'text',
                content: {
                    content_type: 'text/plain',
                    value: 'testing'
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply.vclock).to.exist;
                expect(reply.content).to.be.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.contain.keys(['value', 'content_type']);
                expect(reply.content[0].value).to.equal('testing');
                expect(reply.content[0].content_type).to.equal('text/plain');

                done();
            });
        });

        it('can retrieve text from a key', function (done) {

            client.get({
                bucket: '_test_keys',
                key: 'text'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply.vclock).to.exist;
                expect(reply.content).to.be.an('array');
                expect(reply.content).to.have.length.gte(1);
                expect(reply.content[0]).to.contain.keys(['value', 'content_type']);
                expect(reply.content[0].value).to.equal('testing');
                expect(reply.content[0].content_type).to.equal('text/plain');

                done();
            });
        });

        it('can write large data to a key', function (done) {

            var data = new Array(100000).join('12345');

            client.put({
                bucket: '_test_keys',
                key: 'large',
                content: {
                    value: data,
                    content_type: 'text/plain'
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply.vclock).to.exist;
                expect(reply.content).to.be.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.contain.keys(['value', 'content_type']);
                expect(reply.content[0].value).to.equal(data);
                expect(reply.content[0].content_type).to.equal('text/plain');

                done();
            });
        });

        it('can list keys', function (done) {

            client.getKeys({ bucket: '_test_keys' }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys).to.have.length.above(0);
                expect(reply.keys[0]).to.be.a('string');

                done();
            });
        });

        it('returns an empty object when listing keys in an empty bucket', function (done) {

            client.getKeys({ bucket: '_test_does_not_exist' }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.deep.equal({});

                done();
            });
        });

        it('can delete a key', function (done) {

            client.del({
                bucket: '_test_keys',
                key: 'text'
            }, function (err) {

                expect(err).to.not.exist;
                client.del({
                    bucket: '_test_keys',
                    key: 'large'
                }, function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });
    });

    describe('(streams)', function () {

        it('can write text to a key', function (done) {

            var key = client.put({
                bucket: '_test_keys',
                key: 'text',
                content: {
                    content_type: 'text/plain',
                    value: 'testing'
                },
                return_body: true
            });
            
            key.on('data', function (data) {

                expect(data).to.be.an('object');
                expect(data.vclock).to.exist;
                expect(data.content).to.be.an('array');
                expect(data.content).to.have.length(1);
                expect(data.content[0]).to.contain.keys(['value', 'content_type']);
                expect(data.content[0].value).to.equal('testing');
                expect(data.content[0].content_type).to.equal('text/plain');
            });

            key.on('end', done);
        });

        it('can retrieve text from a key', function (done) {

            var key = client.get({
                bucket: '_test_keys',
                key: 'text'
            });

            key.on('data', function (data) {

                expect(data).to.be.an('object');
                expect(data.vclock).to.exist;
                expect(data.content).to.be.an('array');
                expect(data.content).to.have.length.gte(1);
                expect(data.content[0]).to.contain.keys(['value', 'content_type']);
                expect(data.content[0].value).to.equal('testing');
                expect(data.content[0].content_type).to.equal('text/plain');
            });

            key.on('end', done);
        });

        it('can list keys', function (done) {

            var keys = client.getKeys({ bucket: '_test_keys' });

            keys.on('data', function (data) {

                expect(data).to.be.an('object');
                expect(data.keys).to.be.an('array');
                expect(data.keys).to.have.length.above(0);
                expect(data.keys[0]).to.be.a('string');
            });

            keys.on('end', done);
        });

        it('can delete a key', function (done) {

            var key = client.del({
                bucket: '_test_keys',
                key: 'text'
            });

            key.resume();
            key.on('end', done);
        });
    });
});
