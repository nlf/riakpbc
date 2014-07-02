var Lab = require('lab');
var RiakPBC = require('../');

var after = Lab.after;
var before = Lab.before;
var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

describe('client', function () {

    describe('callbacks', function () {

        it('returns an error when unable to connect', function (done) {

            var client = RiakPBC.createClient({ port: 4312, connect_timeout: 10 });

            client.ping(function (err, reply) {

                expect(err).to.exist;

                done();
            });
        });

        it('destroys the client when asked', function (done) {

            var client = RiakPBC.createClient({ min_connections: 5 });

            expect(client.pool.getPoolSize()).to.equal(5);

            client.end(function () {

                expect(client.pool.getPoolSize()).to.equal(0);
                done();
            });
        });
    });

    describe('streams', function () {

        it('returns an error when unable to connect', function (done) {

            var client = RiakPBC.createClient({ port: 4312, connect_timeout: 10 });

            var ping = client.ping();
            ping.on('error', function (err) {

                expect(err).to.exist;
                done();
            });
        });
    });
});
