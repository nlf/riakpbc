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
                expect(reply).to.have.property('props');
                expect(reply.props).to.be.an('object');
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
                    expect(reply).to.have.property('props');
                    expect(reply.props).to.be.an('object');
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
            }, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });
    });

    describe('(streams)', function () {

        it('can get a bucket type', function (done) {

            var type = client.getBucketType({
                type: '_test_crdt_counter'
            });

            type.on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('props');
                expect(reply.props).to.be.an('object');
                expect(reply.props).to.have.property('datatype', 'counter');
                expect(reply.props).to.have.property('allow_mult', true);
                n_val = reply.props.n_val;
            });

            type.on('end', done);
        });

        it('can change a bucket type', function (done) {

            var type = client.setBucketType({
                type: '_test_crdt_counter',
                props: {
                    n_val: n_val + 1
                }
            });

            type.resume();
            type.on('end', function () {

                var type = client.getBucketType({
                    type: '_test_crdt_counter'
                });

                type.on('data', function (reply) {

                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('props');
                    expect(reply.props).to.be.an('object');
                    expect(reply.props).to.have.property('datatype', 'counter');
                    expect(reply.props).to.have.property('allow_mult', true);
                    expect(reply.props).to.have.property('n_val', n_val + 1);
                });

                type.on('end', done);
            });
        });

        after(function (done) {

            var type = client.setBucketType({
                type: '_test_crdt_counter',
                props: {
                    n_val: n_val
                }
            });

            type.resume();
            type.on('end', done);
        });
    });
});
