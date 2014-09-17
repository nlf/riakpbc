var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();
var context;

describe('Sets', function () {

    describe('(callbacks)', function () {

        it('can initialize a set', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        adds: ['one']
                    }
                }
            }, function (err) {
                
                expect(err).to.not.exist;
                done();
            });
        });

        it('can retrieve a set', function (done) {

            client.getCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('type').that.is.a('number').that.equals(2);
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.deep.property('value.set_value').that.is.an('array').that.deep.equals(['one']);
                context = reply.context;
                done();
            });
        });

        it('can append to a set', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        adds: ['two', 'three']
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {
                
                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.property('set_value').that.is.an('array').that.has.members(['one', 'two', 'three']);
                context = reply.context;
                done();
            });
        });

        it('can remove from a set', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        removes: ['three']
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {
                
                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.property('set_value').that.is.an('array').that.has.members(['one', 'two']);
                expect(reply.set_value).to.not.contain('three');
                context = reply.context;
                done();
            });
        });

        it('can add and remove from a set at the same time', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        adds: ['a', 'b', 'c'],
                        removes: ['one', 'two']
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {
                
                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.property('set_value').that.is.an('array').that.has.members(['a', 'b', 'c']);
                expect(reply.set_value).to.not.have.members(['one', 'two', 'three']);
                done();
            });
        });

        after(function (done) {

            client.del({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set'
            }, done);
        });
    });

    describe('(streams)', function () {

        it('can initialize a set', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        adds: ['one']
                    }
                }
            }).on('end', done).resume();
        });

        it('can retrieve a set', function (done) {

            client.getCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set'
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('type').that.is.a('number').that.equals(2);
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.deep.property('value.set_value').that.is.an('array').that.deep.equals(['one']);
                context = reply.context;
            }).on('end', done);
        });

        it('can append to a set', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        adds: ['two', 'three']
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {
                
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.property('set_value').that.is.an('array').that.has.members(['one', 'two', 'three']);
                context = reply.context;
            }).on('end', done);
        });

        it('can remove from a set', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        removes: ['three']
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {
                
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.property('set_value').that.is.an('array').that.has.members(['one', 'two']);
                expect(reply.set_value).to.not.contain('three');
                context = reply.context;
            }).on('end', done);
        });

        it('can add and remove from a set at the same time', function (done) {

            client.putCrdt({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set',
                op: {
                    set_op: {
                        adds: ['a', 'b', 'c'],
                        removes: ['one', 'two']
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {
                
                expect(reply).to.be.an('object');
                expect(reply).to.have.a.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.a.property('set_value').that.is.an('array').that.has.members(['a', 'b', 'c']);
                expect(reply.set_value).to.not.have.members(['one', 'two', 'three']);
            }).on('end', done);
        });

        after(function (done) {

            client.del({
                bucket: '_test_sets',
                type: '_test_crdt_set',
                key: 'set'
            }).on('end', done).resume();
        });
    });
});
