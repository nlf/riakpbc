var Fs = require('fs');
var Path = require('path');
var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

var searchSchema = {
    name: '_test_search_schema',
    content: Fs.readFileSync(Path.join(__dirname, 'test-schema.xml'))
};


describe('Search', function () {

    describe('(callbacks)', function () {

        it('can create a schema', function (done) {

            client.putSearchSchema({
                schema: searchSchema
            }, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('can retrieve a schema', function (done) {

            client.getSearchSchema({
                name: searchSchema.name
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.have.property('schema');
                expect(reply.schema).to.have.property('name', searchSchema.name);
                expect(reply.schema).to.have.property('content', searchSchema.content.toString());
                done();
            });
        });

        it('can create an index', function (done) {

            client.putSearchIndex({
                index: {
                    name: '_test_search',
                    schema: searchSchema.name
                }
            }, function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        it('can retrieve an index', { timeout: 10000 }, function (done) {

            var getIndex = function () {

                client.getSearchIndex({
                    name: '_test_search'
                }, function (err, reply) {

                    if (err && err.message === 'notfound') {
                        return getIndex();
                    }

                    expect(err).to.not.exist;
                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('index');
                    expect(reply.index).to.be.an('array');
                    expect(reply.index).to.have.length(1);
                    expect(reply.index[0]).to.be.an('object');
                    expect(reply.index[0]).to.have.property('name', '_test_search');
                    expect(reply.index[0]).to.have.property('schema', searchSchema.name);
                    done();
                });
            };

            getIndex();
        });

        it('can assign a search index to a bucket', function (done) {

            client.setBucket({
                bucket: '_test_search',
                props: {
                    search_index: '_test_search'
                }
            }, function (err) {
                
                expect(err).to.not.exist;
                client.put({
                    bucket: '_test_search',
                    key: '_test_search_key',
                    content: {
                        value: JSON.stringify({
                            title: 'test',
                            text: 'abc 123'
                        }),
                        content_type: 'application/json'
                    }
                }, function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });

        it('can search', { timeout: 10000 }, function (done) {

            var search = function () {

                client.search({
                    q: 'text:abc AND title:test',
                    index: '_test_search'
                }, function (err, reply) {

                    expect(err).to.not.exist;
                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('num_found');

                    if (reply.num_found === 0) {
                        return search();
                    }

                    expect(reply.num_found).to.be.above(0);
                    expect(reply).to.have.property('docs');
                    expect(reply.docs).to.be.an('array');
                    expect(reply.docs).to.have.length.above(0);
                    done();
                });
            };

            search();
        });

        it('can delete a search index', function (done) {

            client.setBucket({
                bucket: '_test_search',
                props: {
                    search_index: '_dont_index_'
                }
            }, function (err) {

                expect(err).to.not.exist;
                client.delSearchIndex({
                    name: '_test_search'
                }, function (err) {

                    expect(err).to.not.exist;
                    client.del({
                        bucket: '_test_search',
                        key: '_test_search_key'
                    }, function (err) {
                        
                        expect(err).to.not.exist;
                        done();
                    });
                });
            });
        });
    });

    describe('(streams)', function () {

        it('can create a schema', function (done) {

            client.putSearchSchema({
                schema: searchSchema
            }).on('end', done).resume();
        });

        it('can retrieve a schema', function (done) {

            client.getSearchSchema({
                name: searchSchema.name
            }).on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.have.property('schema');
                expect(reply.schema).to.have.property('name', searchSchema.name);
                expect(reply.schema).to.have.property('content', searchSchema.content.toString());
            }).on('end', done);
        });

        it('can create an index', function (done) {

            client.putSearchIndex({
                index: {
                    name: '_test_search',
                    schema: searchSchema.name
                }
            }).on('end', done).resume();
        });

        it('can retrieve an index', { timeout: 10000 }, function (done) {

            var retry = false;

            var getIndex = function () {

                client.getSearchIndex({
                    name: '_test_search'
                }).on('error', function (err) {

                    if (err && err.message) {
                        retry = true;
                    }
                }).on('data', function (reply) {

                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('index');
                    expect(reply.index).to.be.an('array');
                    expect(reply.index).to.have.length(1);
                    expect(reply.index[0]).to.be.an('object');
                    expect(reply.index[0]).to.have.property('name', '_test_search');
                    expect(reply.index[0]).to.have.property('schema', searchSchema.name);
                    retry = false;
                }).on('end', function () {
                    if (retry) {
                        return getIndex();
                    }

                    done();
                });
            };

            getIndex();
        });

        it('can assign a search index to a bucket', function (done) {

            client.setBucket({
                bucket: '_test_search',
                props: {
                    search_index: '_test_search'
                }
            }).on('end', function () {

                client.put({
                    bucket: '_test_search',
                    key: '_test_search_key',
                    content: {
                        value: JSON.stringify({
                            title: 'test',
                            text: 'abc 123'
                        }),
                        content_type: 'application/json'
                    }
                }).on('end', done).resume();
            }).resume();
        });

        it('can search', { timeout: 10000 }, function (done) {

            var retry = false;

            var search = function () {
                client.search({
                    q: 'text:abc AND title:test',
                    index: '_test_search'
                }).on('error', function (err) {

                    if (err && err.message === 'notfound') {
                        retry = true;
                    }
                }).on('data', function (reply) {

                    expect(reply).to.be.an('object');
                    expect(reply).to.have.property('docs');
                    expect(reply.docs).to.be.an('array');
                    expect(reply.docs).to.have.length.above(0);
                    expect(reply).to.have.property('num_found');
                    expect(reply.num_found).to.be.above(0);
                    retry = false;
                }).on('end', function () {

                    if (retry) {
                        return search();
                    }

                    done();
                });
            };

            search();

        });

        it('can delete a search index', function (done) {

            client.setBucket({
                bucket: '_test_search',
                props: {
                    search_index: '_dont_index_'
                }
            }).on('end', function () {

                client.delSearchIndex({
                    name: '_test_search'
                }).on('end', function () {

                    client.del({
                        bucket: '_test_search',
                        key: '_test_search_key'
                    }).on('end', done).resume();
                }).resume();
            }).resume();
        });
    });
});
