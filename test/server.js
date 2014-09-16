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
                expect(reply).to.be.an('object');
                expect(reply).to.contain.keys(['node', 'server_version']);
                done();
            });
        });

        it('can ping', function (done) {

            client.ping(function (err, reply) {

                expect(err).to.not.exist;
                expect(reply).to.be.an('object');
                expect(reply).to.be.empty;
                done();
            });
        });
    });

    describe('(streams)', function () {

        it('can get server info', function (done) {

            client.getServerInfo().on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.contain.keys(['node', 'server_version']);
            }).on('end', done);
        });

        it('can ping', function (done) {

            client.ping().on('data', function (reply) {

                expect(reply).to.be.an('object');
                expect(reply).to.be.empty;
            }).on('end', done);
        });
    });
});
