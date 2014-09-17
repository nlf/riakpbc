var RiakPBC = require('../');
var Lab = require('lab');
var Exec = require('child_process').exec;

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

describe('Security', function () {

    describe('(disabled)', function () {

        it('returns an error when attempting to use auth without a secure node', function (done) {

            var client = RiakPBC.createClient({ auth: { user: 'riak', password: 'testing' } });
            client.ping(function (err) {

                expect(err).to.exist;
                expect(err.message).to.equal('Security not enabled; STARTTLS not allowed.');
                done();
            });
        });
    });

    describe('(enabled)', function () {

        before(function (done) {

            Exec('make enable-security', { env: process.env }, done);
        });

        it('returns an error when attempting to use a secure node without auth', function (done) {

            var client = RiakPBC.createClient();
            client.ping(function (err) {

                expect(err).to.exist;
                expect(err.message).to.equal('Security is enabled, please STARTTLS first');
                done();
            });
        });

        it('automatically upgrades to a secure connection when auth is provided', function (done) {

            var client = RiakPBC.createClient({ auth: { user: 'riak', password: 'testing' } });
            client.ping(function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        after(function (done) {

            Exec('make disable-security', { env: process.env }, done);
        });
    });
});
