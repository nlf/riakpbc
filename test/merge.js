var Lab = require('lab');
var Merge = require('../lib/merge');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

describe('Merge', function () {

    it('merges two values', function (done) {

        var obj1 = {
            test: 'data'
        };

        var obj2 = {
            other: 'stuff'
        };

        expect(Merge(obj1, obj2)).to.deep.equal({
            test: 'data',
            other: 'stuff'
        });

        done();
    });

    it('merges arrays', function (done) {

        var obj1 = {
            keys: ['one', 'two']
        };

        var obj2 = {
            keys: ['three', 'four']
        };

        expect(Merge(obj1, obj2)).to.deep.equal({
            keys: ['one', 'two', 'three', 'four']
        });

        done();
    });

    it('merges mapreduce phase objects', function (done) {

        var obj1 = {};
        var obj2 = {
            phase: 0,
            response: '["one"]'
        };

        expect(Merge(obj1, obj2)).to.deep.equal({
            '0': ['one']
        });

        done();
    });

    it('merges mapreduce phase objects when a phase already exists', function (done) {

        var obj1 = {
            '0': ['one']
        };

        var obj2 = {
            phase: 0,
            response: '["two"]'
        };

        expect(Merge(obj1, obj2)).to.deep.equal({
            '0': ['one', 'two']
        });

        done();
    });
});
