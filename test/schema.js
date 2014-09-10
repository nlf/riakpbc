var Lab = require('lab');
var Schema = require('../lib/schema');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

describe('schema', function () {

    it('populates defaults when given undefined', function (done) {

        Schema.validate(undefined, function (err, value) {

            expect(err).to.not.exist;
            expect(value).to.deep.equal({
                host: '127.0.0.1',
                port: 8087,
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

        Schema.validate({}, function (err, value) {

            expect(err).to.not.exist;
            expect(value).to.deep.equal({
                host: '127.0.0.1',
                port: 8087,
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
            Schema.validate({ port: 'bacon' });
        }).to.throw(Error);

        done();
    });
});
