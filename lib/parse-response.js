var textPattern = /^text\/*/;

module.exports = function parseResponse(response) {
    var key, contentType;

    for (key in response) {
        if (Buffer.isBuffer(response[key])) {
            if (key === 'value') {
                if (response.content_type && response[key].length !== 0) {
                    contentType = getContentType(response);
                    if (contentType === 'application/json') {
                        response[key] = JSON.parse(response[key]);
                    } else if (textPattern.test(contentType)) {
                        response[key] = response[key].toString();
                    }
                } else {
                    response[key] = response[key].toString();
                }
            } else if (key !== 'vclock') {
                response[key] = response[key].toString();
            }
        } else if (typeof response[key] === 'object') {
            response[key] = parseResponse(response[key]);
        }
    }

    return response;
};

function getContentType(response) {
    return response.content_type.toString().toLowerCase();
}
