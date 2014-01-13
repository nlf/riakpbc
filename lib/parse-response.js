var textPattern = /^text\/*/;

module.exports = function parseResponse(response) {
    var key;
    var contentType;
    for (key in response) {
        if (key !== 'vclock' && key !== 'value' && Buffer.isBuffer(response[key])) {
            response[key] = response[key].toString();
        } else if (!Buffer.isBuffer(response[key]) && typeof response[key] === 'object') {
            response[key] = parseResponse(response[key]);
        } else if (key === 'value') {
            if (response.content_type) {
                contentType = getContentType(response);
                if (contentType === 'application/json') {
                    response[key] = JSON.parse(response[key]);
                } else if (textPattern.test(contentType)) {
                    response[key] = response[key].toString();
                }
            }
        }
    }

    return response;
};

function getContentType(response) {
    var contentType = response.content_type.toString().toLowerCase();
    return contentType;
}
