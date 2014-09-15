var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

var n_val;

describe('Bucket Types', function () {

    describe('(callbacks)', function () {

        it('can get a bucket type', function (done) {

            client.getBucketType({
                type: '_test_crdt_counter'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('props').that.is.an('object');
                expect(reply.props).to.have.property('datatype', 'counter');
                expect(reply.props).to.have.property('allow_mult', true);
                n_val = reply.props.n_val;
                done();
            });
        });

        it('can change a bucket type', function (done) {

            client.setBucketType({
                type: '_test_crdt_counter',
                props: {
                    n_val: n_val + 1
                }
            }, function (err) {

                expect(err).to.not.exist;
                client.getBucketType({
                    type: '_test_crdt_counter'
                }, function (err, reply) {

                    expect(err).to.not.exist;
                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('props').that.is.an('object');
                    expect(reply.props).to.have.property('datatype', 'counter');
                    expect(reply.props).to.have.property('allow_mult', true);
                    expect(reply.props).to.have.property('n_val', n_val + 1);
                    done();
                });
            });
        });

        after(function (done) {

            client.setBucketType({
                type: '_test_crdt_counter',
                props: {
                    n_val: n_val
                }
            }, done);
        });
    });

    describe('(streams)', function () {

        it('can get a bucket type', function (done) {

            client.getBucketType({
                type: '_test_crdt_counter'
            }).on('error', function (err) {

                expect(err).to.not.exist;
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('props').that.is.an('object');
                expect(reply.props).to.have.property('datatype', 'counter');
                expect(reply.props).to.have.property('allow_mult', true);
                n_val = reply.props.n_val;
            }).on('end', done);
        });

        it('can change a bucket type', function (done) {

            client.setBucketType({
                type: '_test_crdt_counter',
                props: {
                    n_val: n_val + 1
                }
            }).on('error', function (err) {

                expect(err).to.not.exist;
            }).on('end', function () {

                client.getBucketType({
                    type: '_test_crdt_counter'
                }).on('error', function (err) {

                    expect(err).to.not.exist;
                }).on('data', function (reply) {

                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('props').that.is.an('object');
                    expect(reply.props).to.have.property('datatype', 'counter');
                    expect(reply.props).to.have.property('allow_mult', true);
                    expect(reply.props).to.have.property('n_val', n_val + 1);
                }).on('end', done);
            }).resume();
        });

        after(function (done) {

            client.setBucketType({
                type: '_test_crdt_counter',
                props: {
                    n_val: n_val
                }
            }).on('end', done).resume();
        });
    });
});
