var Lab = require('lab');
var RiakPBC = require('../');

var after = Lab.after;
var before = Lab.before;
var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

var client = RiakPBC.createClient();

describe('server commands', function () {

    describe('callbacks', function () {

        it('can get server info', function (done) {

            client.getServerInfo(function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.contain.keys(['node', 'server_version']);

                done();
            });
        });

        it('can ping', function (done) {

            client.ping(function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.deep.equal({});

                done();
            });
        });
    });

    describe('streams', function () {

        it('can get server info', function (done) {

            var info = client.getServerInfo();
            info.on('data', function (data) {

                expect(data).to.contain.keys(['node', 'server_version']);
            });

            info.on('end', done);
        });

        it('can ping', function (done) {

            var ping = client.ping();
            ping.on('data', function (data) {

                expect(data).to.deep.equal({});
            });

            ping.on('end', done);
        });
    });
});
