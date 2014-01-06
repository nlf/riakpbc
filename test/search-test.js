var _ = require('lodash-node');
var chai = require('chai');
chai.Assertion.includeStack = true; // defaults to false

var expect = chai.expect;
var inspect = require('eyespect').inspector();
var q = require('q');
var sinon = require('sinon');

var riakpbc = require('../index');
var client = riakpbc.createClient({ host: 'localhost', port: 8087 });

var numRows = 10;
var bucket = 'search_test';
describe('search', function searchSuite() {
    this.slow('1s');
    before(function beforeBlock(done) {
        var promise = connectClient();
        promise.then(setupFixtures).nodeify(done);
    });

    after(function afterBlock(done) {
        this.timeout('10s');
        return done();
    });

    it('should return search results', function (done) {
        var opts = {
            q: 'bar:value_*',
            index: bucket,
            rows: 1,
            start: 0
        };
        client.search(opts, cb);

        function cb(err, reply) {
            expect(err).to.not.exist;
            expect(reply, 'should get search reply').to.exist;
            expect(reply).to.have.ownProperty('docs');
            expect(reply).to.have.ownProperty('max_score');
            expect(reply.docs).to.be.an('array');
            expect(reply.docs.length).to.equal(opts.rows);
            expect(reply, 'num_found field missing in reply').to.have.ownProperty('num_found');
            expect(reply.num_found).to.be.above(opts.rows);
            done();
        }
    });
});

function connectClient() {
    var promise = q.ninvoke(client, 'connect');
    return promise;
}

function setupFixtures() {
    var promises = _.range(0, numRows).map(createRow);
    return q.all(promises);
}

function createRow(id) {
    var key = [id, 'key'].join('_');
    var value = {
        bar: 'value_' + id
    };
    var content = {
        value: JSON.stringify(value),
        content_type: 'application/json'
    };
    var saveOpts = {
        bucket: bucket,
        content: content,
        key: key
    };

    var promise = q.ninvoke(client, 'put', saveOpts);
    return promise;
}
