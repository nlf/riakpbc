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

            client.getBuckets(function (err, reply) {

                expect(err).to.not.exist;

                if (reply.buckets) {
                    expect(reply.buckets).to.be.an('array');
                }

                done();
            });
        });

        it('can get bucket properties', function (done) {

            client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply.props).to.be.an('object');
                // don't bother checking for everything, just make sure it's a bucket
                expect(reply.props).to.contain.keys(['allow_mult', 'n_val', 'r', 'rw', 'dw', 'w']);

                done();
            });
        });

        it('can set bucket properties', function (done) {

            client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                expect(err).to.not.exist;
                allow_mult = reply.props.allow_mult;

                client.setBucket({ bucket: '_test_buckets', props: { allow_mult: !allow_mult } }, function (err, reply) {

                    expect(err).to.not.exist;
                    expect(reply).to.deep.equal({});
                    client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                        expect(err).to.not.exist;
                        expect(reply.props.allow_mult).to.equal(!allow_mult);

                        done();
                    });
                });
            });
        });

        it('can reset bucket properties', function (done) {

            client.resetBucket({ bucket: '_test_buckets' }, function (err, reply) {

                expect(err).to.not.exist;

                client.getBucket({ bucket: '_test_buckets' }, function (err, reply) {

                    expect(err).to.not.exist;
                    expect(reply.props.allow_mult).to.equal(allow_mult);

                    done();
                });
            });
        });
    });

    describe('(streams)', function () {

        it('can list buckets', function (done) {

            var buckets = client.getBuckets();
            buckets.on('data', function (data) {

                expect(data).to.have.key('buckets');
                expect(data.buckets).to.be.an('array');
            });

            buckets.on('end', done);
        });

        it('can get bucket properties', function (done) {

            var bucket = client.getBucket({ bucket: '_test_buckets' });
            bucket.on('data', function (data) {

                expect(data).to.have.key('props');
            });

            bucket.on('end', done);
        });

        it('can set bucket properties', function (done) {

            var bucket = client.setBucket({
                bucket: '_test_buckets',
                props: {
                    allow_mult: true
                }
            });

            bucket.resume();
            bucket.on('end', done);
        });

        it('can reset bucket properties', function (done) {

            var bucket = client.resetBucket({ bucket: '_test_buckets' });
            
            bucket.resume();
            bucket.on('end', done);
        });
    });
});
