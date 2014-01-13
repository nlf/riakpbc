var _ = require('lodash-node');
var chai = require('chai');
chai.Assertion.includeStack = true; // defaults to false

var expect = chai.expect;
var inspect = require('eyespect').inspector();
var q = require('q');
var sinon = require('sinon');

var riakpbc = require('../index');
var client = riakpbc.createClient({ host: 'localhost', port: 8087 });

var bucket = 'text_content_type_test';
var key = 'text_content_key_1';
var value = 'value_1';

describe('Text Content Type', function searchSuite() {
    this.slow('1s');
    before(function beforeBlock(done) {
        var promise = connectClient();
        promise.then(setupFixtures).nodeify(done);
    });

    after(function afterBlock(done) {
        this.timeout('10s');
        return done();
    });

    it('should get with key', function (done) {
        var opts = {
            bucket: bucket,
            key: key
        };
        client.get(opts, cb);

        function cb(err, reply) {
            expect(err).to.not.exist;
            expect(reply).to.exist;
            expect(reply).to.have.ownProperty('content');
            var content = reply.content;
            expect(content).to.exist;
            expect(content).to.be.an('array');
            var replyValue = content[0].value;
            expect(replyValue).to.exist;
            expect(replyValue).to.be.a('string');
            expect(replyValue).to.equal(value);
            done();
        }
    });
});

function connectClient() {
    var promise = q.ninvoke(client, 'connect');
    return promise;
}

function setupFixtures() {
    var promise = createRow();
    return promise;
}

function createRow() {
    var content = {
        value: 'value_1',
        content_type: 'text/plain'
    };
    var saveOpts = {
        bucket: bucket,
        content: content,
        key: key
    };

    var promise = q.ninvoke(client, 'put', saveOpts);
    return promise;
}
