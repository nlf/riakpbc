var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();
var allow_mult;

describe('Buckets', function () {

    describe('(callbacks)', function () {

        it('can list buckets', function (done) {

            client.getBuckets(null, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('buckets').that.is.an('array');
                done();
            });
        });

        it('can get bucket properties', function (done) {

            client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('props').that.is.an('object');
                expect(reply.props).to.contain.keys(['allow_mult', 'n_val', 'r', 'rw', 'dw', 'w']);
                allow_mult = reply.props.allow_mult;
                done();
            });
        });

        it('can set bucket properties', function (done) {

            client.setBucket({ bucket: '_test_buckets', props: { allow_mult: !allow_mult } }, function (err) {

                expect(err).to.not.exist;
                client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                    expect(err).to.not.exist;
                    expect(reply).to.be.an('object');
                    expect(reply).to.have.deep.property('props.allow_mult', !allow_mult);
                    done();
                });
            });
        });

        it('can reset bucket properties', function (done) {

            client.resetBucket({ bucket: '_test_buckets' }, function (err) {

                expect(err).to.not.exist;
                client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                    expect(err).to.not.exist;
                    expect(reply).to.be.an('object');
                    expect(reply).to.have.deep.property('props.allow_mult', allow_mult);
                    done();
                });
            });
        });
    });

    describe('(streams)', function () {

        it('can list buckets', function (done) {

            client.getBuckets().on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('buckets').that.is.an('array');
            }).on('end', done);
        });

        it('can get bucket properties', function (done) {

            client.getBucket({ bucket: '_test_buckets' }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('props').that.is.an('object');
                expect(reply.props).to.contain.keys(['allow_mult', 'n_val', 'r', 'rw', 'dw', 'w']);
                allow_mult = reply.props.allow_mult;
            }).on('end', done);
        });

        it('can set bucket properties', function (done) {

            client.setBucket({
                bucket: '_test_buckets',
                props: {
                    allow_mult: true
                }
            }).on('end', function () {

                client.getBucket({ bucket: '_test_buckets' }).on('error', function (err) {

                    expect(err).to.not.exist;
                }).on('data', function (reply) {

                    expect(reply).to.be.an('object');
                    expect(reply).to.have.deep.property('props.allow_mult', !allow_mult);
                }).on('end', done);
            }).resume();
        });

        it('can reset bucket properties', function (done) {

            client.resetBucket({ bucket: '_test_buckets' }).on('end', function () {

                client.getBucket({ bucket: '_test_buckets' }).on('error', function (err) {

                    expect(err).to.not.exist;
                }).on('data', function (reply) {

                    expect(reply).to.be.an('object');
                    expect(reply).to.have.deep.property('props.allow_mult', allow_mult);
                }).on('end', done);
            }).resume();
        });
    });
});
