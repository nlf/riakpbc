var Lab = require('lab');
var Parser = require('../lib/parser');

var lab = exports.lab = Lab.script();
var after = lab.after;
var before = lab.before;
var describe = lab.experiment;
var expect = Lab.expect;
var it = lab.test;

describe('Parser', function () {

    it('parses json responses', function (done) {

        var obj = {
            content_type: 'application/json',
            value: new Buffer('{"test":true}')
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            content_type: 'application/json',
            value: {
                test: true
            }
        });

        done();
    });

    it('does not parse json when parse = false', function (done) {

        var obj = {
            content_type: 'application/json',
            value: new Buffer('{"test":true}')
        };

        expect(Parser.parse(obj, false)).to.deep.equal({
            content_type: 'application/json',
            value: new Buffer('{"test":true}')
        });

        done();
    });

    it('parses text responses', function (done) {

        var obj = {
            content_type: 'text/plain',
            value: new Buffer('testing')
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            content_type: 'text/plain',
            value: 'testing'
        });

        done();
    });

    it('does not parse text when parse = false', function (done) {

        var obj = {
            content_type: 'text/plain',
            value: new Buffer('testing')
        };

        expect(Parser.parse(obj, false)).to.deep.equal({
            content_type: 'text/plain',
            value: new Buffer('testing')
        });

        done();
    });

    it('does not blow up when value has length of 0', function (done) {

        var obj = {
            content_type: 'text/plain',
            value: new Buffer(0)
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            content_type: 'text/plain',
            value: new Buffer(0)
        });

        done();
    });

    it('does not parse content when content_type is not set', function (done) {

        var obj = {
            value: new Buffer('testing')
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            value: new Buffer('testing')
        });

        done();
    });

    it('does not parse content when content_type is not json or text', function (done) {

        var obj = {
            content_type: 'application/xml',
            value: new Buffer('testing')
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            content_type: 'application/xml',
            value: new Buffer('testing')
        });

        done();
    });

    it('parses index values when parse = true', function (done) {

        var obj = {
            key: 'test_bin',
            value: new Buffer('test')
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            key: 'test_bin',
            value: 'test'
        });

        done();
    });

    it('does not parse index values when parse = false', function (done) {

        var obj = {
            key: 'test_bin',
            value: new Buffer('test')
        };

        expect(Parser.parse(obj, false)).to.deep.equal({
            key: 'test_bin',
            value: new Buffer('test')
        });

        done();
    });

    it('leaves vclocks as buffers when parse = true', function (done) {

        var obj = {
            content_type: 'text/plain',
            value: new Buffer('testing'),
            vclock: new Buffer([0x00, 0x01, 0x02, 0x03])
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            content_type: 'text/plain',
            value: 'testing',
            vclock: new Buffer([0x00, 0x01, 0x02, 0x03])
        });

        done();
    });

    it('leaves context as buffer when parse = true', function (done) {

        var obj = {
            context: new Buffer([0x00, 0x01, 0x02, 0x03])
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            context: new Buffer([0x00, 0x01, 0x02, 0x03])
        });

        done();
    });

    it('converts other buffers to strings', function (done) {

        var obj = {
            test: new Buffer('buffers')
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            test: 'buffers'
        });

        done();
    });

    it('parses nested objects', function (done) {

        var obj = {
            nested: {
                content_type: 'text/plain',
                value: new Buffer('testing')
            }
        };

        expect(Parser.parse(obj, true)).to.deep.equal({
            nested: {
                content_type: 'text/plain',
                value: 'testing'
            }
        });

        done();
    });

    it('does not parse nested objects when parse = false', function (done) {

        var obj = {
            nested: {
                content_type: 'text/plain',
                value: new Buffer('testing')
            }
        };

        expect(Parser.parse(obj, false)).to.deep.equal({
            nested: {
                content_type: 'text/plain',
                value: new Buffer('testing')
            }
        });

        done();
    });
});
