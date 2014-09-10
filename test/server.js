var Lab = require('lab');
var RiakPBC = require('../');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

var client = RiakPBC.createClient();

describe('Server', function () {

    describe('(callbacks)', function () {

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

    describe('(streams)', function () {

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
