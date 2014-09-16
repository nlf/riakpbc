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

describe('Maps', function () {

    describe('(callbacks)', function () {

        it('can create a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        adds: [{
                            name: '_counter',
                            type: 1
                        }, {
                            name: '_set',
                            type: 2
                        }, {
                            name: '_register',
                            type: 3
                        }, {
                            name: '_flag',
                            type: 4
                        }, {
                            name: '_map',
                            type: 5
                        }]
                    }
                }
            }, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('can get a map', function (done) {

            client.getCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('type', 3);
                expect(reply).to.have.property('value').that.is.an('object');
                done();
            });
        });

        it('can update a counter within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_counter',
                                type: 1
                            },
                            counter_op: {
                                increment: 5
                            }
                        }]
                    }
                },
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(1);
                expect(reply.map_value[0]).to.have.deep.property('field.name', '_counter');
                expect(reply.map_value[0]).to.have.deep.property('field.type', 1);
                expect(reply.map_value[0]).to.have.property('counter_value');
                expect(reply.map_value[0].counter_value.toNumber()).to.equal(5);
                done();
            });
        });

        it('can update a set within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_set',
                                type: 2
                            },
                            set_op: {
                                adds: ['one', 'two']
                            }
                        }]
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(2);
                expect(reply.map_value).to.include({ field: { name: '_set', type: 2 }, set_value: ['one', 'two'] });
                done();
            });
        });

        it('can update a register within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_register',
                                type: 3
                            },
                            register_op: 'testing'
                        }]
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(3);
                expect(reply.map_value).to.include({ field: { name: '_register', type: 3 }, register_value: 'testing' });
                done();
            });
        });

        it('can update a flag within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_flag',
                                type: 4
                            },
                            flag_op: 1
                        }]
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(4);
                expect(reply.map_value).to.include({ field: { name: '_flag', type: 4 }, flag_value: true });
                done();
            });
        });

        it('can update a map within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_map',
                                type: 5
                            },
                            map_op: {
                                updates: [{
                                    field: {
                                        name: '_test',
                                        type: 4
                                    },
                                    flag_op: 2
                                }]
                            }
                        }]
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {
            
                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(5);
                expect(reply.map_value).to.include({ field: { name: '_map', type: 5 }, map_value: [{ field: { name: '_test', type: 4 }, flag_value: false }] });
                done();
            });
        });

        it('can remove a field from a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        removes: [{
                            name: '_map',
                            type: 5
                        }]
                    }
                },
                context: context,
                return_body: true
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(4);
                expect(reply.map_value).to.not.include({ field: { name: '_map', type: 5 }, map_value: [{ field: { name: '_test', type: 4 }, flag_value: false }] });
                done();
            });
        });

        after(function (done) {

            client.del({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map'
            }, done);
        });
    });

    describe('(streams)', function () {

        it('can create a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        adds: [{
                            name: '_counter',
                            type: 1
                        }, {
                            name: '_set',
                            type: 2
                        }, {
                            name: '_register',
                            type: 3
                        }, {
                            name: '_flag',
                            type: 4
                        }, {
                            name: '_map',
                            type: 5
                        }]
                    }
                }
            }).on('end', done).resume();
        });

        it('can get a map', function (done) {

            client.getCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map'
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('type', 3);
                expect(reply).to.have.property('value').that.is.an('object');
            }).on('end', done);
        });

        it('can update a counter within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_counter',
                                type: 1
                            },
                            counter_op: {
                                increment: 5
                            }
                        }]
                    }
                },
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(1);
                expect(reply.map_value[0]).to.have.deep.property('field.name', '_counter');
                expect(reply.map_value[0]).to.have.deep.property('field.type', 1);
                expect(reply.map_value[0]).to.have.property('counter_value');
                expect(reply.map_value[0].counter_value.toNumber()).to.equal(5);
            }).on('end', done);
        });

        it('can update a set within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_set',
                                type: 2
                            },
                            set_op: {
                                adds: ['one', 'two']
                            }
                        }]
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(2);
                expect(reply.map_value).to.include({ field: { name: '_set', type: 2 }, set_value: ['one', 'two'] });
            }).on('end', done);
        });

        it('can update a register within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_register',
                                type: 3
                            },
                            register_op: 'testing'
                        }]
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(3);
                expect(reply.map_value).to.include({ field: { name: '_register', type: 3 }, register_value: 'testing' });
            }).on('end', done);
        });

        it('can update a flag within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_flag',
                                type: 4
                            },
                            flag_op: 1
                        }]
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(4);
                expect(reply.map_value).to.include({ field: { name: '_flag', type: 4 }, flag_value: true });
            }).on('end', done);
        });

        it('can update a map within a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        updates: [{
                            field: {
                                name: '_map',
                                type: 5
                            },
                            map_op: {
                                updates: [{
                                    field: {
                                        name: '_test',
                                        type: 4
                                    },
                                    flag_op: 2
                                }]
                            }
                        }]
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {
            
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                context = reply.context;
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(5);
                expect(reply.map_value).to.include({ field: { name: '_map', type: 5 }, map_value: [{ field: { name: '_test', type: 4 }, flag_value: false }] });
            }).on('end', done);
        });

        it('can remove a field from a map', function (done) {

            client.updateCrdt({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map',
                op: {
                    map_op: {
                        removes: [{
                            name: '_map',
                            type: 5
                        }]
                    }
                },
                context: context,
                return_body: true
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('context').that.is.an.instanceof(Buffer);
                expect(reply).to.have.property('map_value').that.is.an.instanceof(Array);
                expect(reply.map_value).to.have.length(4);
                expect(reply.map_value).to.not.include({ field: { name: '_map', type: 5 }, map_value: [{ field: { name: '_test', type: 4 }, flag_value: false }] });
            }).on('end', done);
        });

        after(function (done) {

            client.del({
                bucket: '_test_maps',
                type: '_test_crdt_map',
                key: '_test_map'
            }).on('end', done).resume();
        });
    });
});
