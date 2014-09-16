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
                expect(reply).to.have.property('vclock').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('content').that.is.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.have.property('value', 'testing');
                expect(reply.content[0]).to.have.property('content_type', 'text/plain');
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
                expect(reply).to.have.property('vclock').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('content').that.is.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.have.property('value', 'testing');
                expect(reply.content[0]).to.have.property('content_type', 'text/plain');
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
                expect(reply).to.have.property('vclock').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('content').that.is.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.have.property('value', data);
                expect(reply.content[0]).to.have.property('content_type', 'text/plain');
                done();
            });
        });

        it('can list keys', function (done) {

            client.getKeys({ bucket: '_test_keys' }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('keys').that.is.an('array');
                expect(reply.keys).to.have.length.above(0);
                done();
            });
        });

        it('returns an empty object when listing keys in an empty bucket', function (done) {

            client.getKeys({ bucket: '_test_does_not_exist' }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.be.empty;
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

            client.put({
                bucket: '_test_keys',
                key: 'text',
                content: {
                    content_type: 'text/plain',
                    value: 'testing'
                },
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('vclock').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('content').that.is.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.have.property('value', 'testing');
                expect(reply.content[0]).to.have.property('content_type', 'text/plain');
            }).on('end', done);
        });

        it('can retrieve text from a key', function (done) {

            client.get({
                bucket: '_test_keys',
                key: 'text'
            }).on('data', function (reply) {


                expect(reply).to.be.an('object');
                expect(reply).to.have.property('vclock').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('content').that.is.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.have.property('value', 'testing');
                expect(reply.content[0]).to.have.property('content_type', 'text/plain');
            }).on('end', done);
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
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('vclock').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('content').that.is.an('array');
                expect(reply.content).to.have.length(1);
                expect(reply.content[0]).to.have.property('value', data);
                expect(reply.content[0]).to.have.property('content_type', 'text/plain');
            }).on('end', done);
        });

        it('can list keys', function (done) {

            client.getKeys({ bucket: '_test_keys' }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply.keys).to.be.an('array');
                expect(reply.keys).to.have.length.above(0);
            }).on('end', done);
        });

        it('returns an empty object when listing keys in an empty bucket', function (done) {

            client.getKeys({ bucket: '_test_does_not_exist' }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.be.empty;
            }).on('end', done);
        });

        it('can delete a key', function (done) {

            client.del({
                bucket: '_test_keys',
                key: 'text'
            }).on('end', function () {

                client.del({
                    bucket: '_test_keys',
                    key: 'large'
                }).on('end', done).resume();
            }).resume();
        });
    });
});
