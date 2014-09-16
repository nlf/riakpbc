var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

describe('Counters', function () {

    describe('(callbacks)', function () {

        it('can initialize a counter', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: 1
                    }
                }
            }, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('can retrieve a counter', function (done) {

            client.getCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('type', 1);
                expect(reply).to.have.property('value').that.is.an('object');
                expect(reply.value).to.have.property('counter_value');
                expect(reply.value.counter_value.toNumber()).to.equal(1);
                done();
            });
        });

        it('can increment a counter', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: 5
                    }
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(6);
                done();
            });
        });

        it('can increment a counter by a string', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: '5'
                    }
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(11);
                done();
            });
        });

        it('can decrement a counter by passing a negative number', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: -2
                    }
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(9);
                done();
            });
        });

        it('can decrement a counter by passing a negative number as a string', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: '-2'
                    }
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(7);
                done();
            });
        });

        it('returns an empty object when retrieving an empty counter', function (done) {

            client.getCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter_nothere'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('type', 1);
                done();
            });
        });

        after(function (done) {

            client.del({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter'
            }, done);
        });
    });

    describe('(streams)', function () {

        it('can initialize a counter', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: 1
                    }
                }
            }).on('end', done).resume();
        });

        it('can retrieve a counter', function (done) {

            client.getCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter'
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('type', 1);
                expect(reply).to.have.property('value').that.is.an('object');
                expect(reply.value).to.have.property('counter_value');
                expect(reply.value.counter_value.toNumber()).to.equal(1);
            }).on('end', done);
        });

        it('can increment a counter', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: 5
                    }
                },
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(6);
            }).on('end', done);
        });

        it('can increment a counter by a string', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: '5'
                    }
                },
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(11);
            }).on('end', done);
        });

        it('can decrement a counter by passing a negative number', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: -2
                    }
                },
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(9);
            }).on('end', done);
        });

        it('can decrement a counter by passing a negative number in a string', function (done) {

            client.updateCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter',
                op: {
                    counter_op: {
                        increment: '-2'
                    }
                },
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('counter_value');
                expect(reply.counter_value.toNumber()).to.equal(7);
            }).on('end', done);
        });

        it('returns an empty object when retrieving an empty counter', function (done) {

            client.getCrdt({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter_nothere'
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('type', 1);
            }).on('end', done);
        });

        after(function (done) {

            client.del({
                bucket: '_test_counters',
                type: '_test_crdt_counter',
                key: 'counter'
            }).on('end', done).resume();
        });
    });
});
