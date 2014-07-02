var Lab = require('lab');
var RiakPBC = require('../');

var after = Lab.after;
var before = Lab.before;
var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

var client = RiakPBC.createClient();
var value;

describe('counters', function () {

    describe('callbacks', function () {

        before(function (done) {

            client.setBucket({
                bucket: '_test_counters',
                props: {
                    allow_mult: true
                }
            }, function (err) {

                expect(err).to.not.exist;
                
                done();
            });
        });

        it('can increment a counter', function (done) {

            client.updateCounter({
                bucket: '_test_counters',
                key: 'counter',
                amount: 1
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.deep.equal({});

                done();
            });
        });

        it('can retrieve a counter', function (done) {

            client.getCounter({
                bucket: '_test_counters',
                key: 'counter'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.have.key('value');
                value = reply.value.toNumber();

                done();
            });
        });

        it('returns an empty object when retrieving an empty counter', function (done) {

            client.getCounter({
                bucket: '_test_counters',
                key: 'counter_nothere'
            }, function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.deep.equal({});

                done();
            });
        });
    });

    describe('streams', function () {

        before(function (done) {

            client.setBucket({
                bucket: '_test_counters',
                props: {
                    allow_mult: true
                }
            }, function (err) {

                expect(err).to.not.exist;
                
                done();
            });
        });

        it('can increment a counter', function (done) {

            var counter = client.updateCounter({
                bucket: '_test_counters',
                key: 'counter',
                amount: 1
            });
            counter.on('data', function (data) {
                // do nothing, just need a listener
            });

            counter.on('end', done);
        });

        it('can retrieve a counter', function (done) {

            var counter = client.getCounter({
                bucket: '_test_counters',
                key: 'counter'
            });
            counter.on('data', function (data) {

                expect(data).to.have.key('value');
            });

            counter.on('end', done);
        });

        it('returns an empty object when retrieving an empty counter', function (done) {

            var counter = client.getCounter({
                bucket: '_test_counters',
                key: 'counter_nothere'
            });
            counter.on('data', function (data) {
                // do nothing, just need a listener
            });

            counter.on('end', done);
        });
    });
});
