var Quorum = require('./quorum');
var textPattern = /^text\/.*/;

exports.parse = function (response, parse) {

    response = Quorum.convert(response);

    for (var key in response) {
        if (Buffer.isBuffer(response[key])) {
            if (key === 'value' && parse) {
                if (response.content_type && response[key].length !== 0) {
                    var contentType = getContentType(response);

                    if (contentType === 'application/json') {
                        response[key] = JSON.parse(response[key]);
                    }
                    else if (textPattern.test(contentType)) {
                        response[key] = response[key].toString();
                    }
                }
            }
            else if (key !== 'vclock' && key !== 'value') {
                response[key] = response[key].toString();
            }
        }
        else if (typeof response[key] === 'object') {
            response[key] = exports.parse(response[key], parse);
        }
    }

    return response;
};

var getContentType = function (response) {

    return response.content_type.toString().toLowerCase();
};
