var Lab = require('lab');
var Options = require('../lib/options');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

describe('Options', function () {

    it('populates defaults when given undefined', function (done) {

        Options.validate(undefined, function (err, value) {

            expect(err).to.not.exist;
            expect(value).to.deep.equal({
                nodes: [{ host: '127.0.0.1', port: 8087 }],
                connect_timeout: 1000,
                request_timeout: 2000,
                idle_timeout: 30000,
                min_connections: 0,
                max_connections: 10,
                parse_values: true
            });

            done();
        });
    });

    it('populates defaults when given an empty object', function (done) {

        Options.validate({}, function (err, value) {

            expect(err).to.not.exist;
            expect(value).to.deep.equal({
                nodes: [{ host: '127.0.0.1', port: 8087 }],
                connect_timeout: 1000,
                request_timeout: 2000,
                idle_timeout: 30000,
                min_connections: 0,
                max_connections: 10,
                parse_values: true
            });

            done();
        });
    });

    it('throws when options are invalid', function (done) {

        expect(function () {
            Options.validate({ port: 'bacon' });
        }).to.throw(Error);

        done();
    });

    it('does not allow host/port combo when specifying nodes', function (done) {

        expect(function () {
            Options.validate({ host: '127.0.0.1', port: 8087, nodes: [{ host: '127.0.0.1', port: 8087 }] });
        }).to.throw(Error);

        done();
    });
});
