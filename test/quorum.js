var Lab = require('lab');
var Quorum = require('../lib/quorum');

var after = Lab.after;
var before = Lab.before;
var describe = Lab.experiment;
var expect = Lab.expect;
var it = Lab.test;

describe('Quorum', function () {

    it('converts strings to numerical values', function (done) {

        var obj = {
            pr: 'one',
            r: 'all',
            w: 'quorum',
            pw: 'default',
            dw: 'one',
            rw: 'all',
            missing: 'one'
        };

        expect(Quorum.convert(obj)).to.deep.equal({
            pr: 4294967294,
            r: 4294967292,
            w: 4294967293,
            pw: 4294967291,
            dw: 4294967294,
            rw: 4294967292,
            missing: 'one'
        });

        done();
    });

    it('converts numerical values to strings', function (done) {

        var obj = {
            pr: 4294967294,
            r: 4294967292,
            w: 4294967293,
            pw: 4294967291,
            dw: 4294967294,
            rw: 4294967292,
            missing: 12341234
        };

        expect(Quorum.convert(obj)).to.deep.equal({
            pr: 'one',
            r: 'all',
            w: 'quorum',
            pw: 'default',
            dw: 'one',
            rw: 'all',
            missing: 12341234
        });

        done();
    });
});
