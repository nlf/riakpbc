var chai = require('chai');
chai.Assertion.includeStack = true; // defaults to false
var expect = chai.expect;

var riakpbc = require('../index');

describe('Streaming error test', function () {
    it('should output error events when using a streaming api', function (done) {
        var invalidPort = 1111;
        var clientOpts = {
            host: 'localhost',
            port: invalidPort,
            timeout: 20 // 20 milliseconds to make test run faster
        };
        var client = riakpbc.createClient(clientOpts);
        var queryOpts = {
            queryType: 1, // range query type
            range_min: 0,
            range_max: 999999,
            index: 'name_bin',
            bucket: 'test'
        };
        var readStream = client.getIndex(queryOpts);
        readStream.on('error', errorHandler);

        function errorHandler(err) {
            expect(err).to.exist;
            expect(err.message).to.equal('Connection timeout');
            done();
        }


    });
});

