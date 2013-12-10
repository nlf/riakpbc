var textPattern = /^text\/\*/;

module.exports = function parseContent(item) {
    if (!item.value || !item.content_type) {
        return;
    }

    var textMatch = textPattern.test(item.content_type);

    if (textMatch) {
        item.value = item.value.toString();
        return;
    }

    if (item.content_type.toLowerCase() === 'application/json') {
        try {
            item.value = JSON.parse(item.value.toString());
        } catch (e) {
            item.value = item.value.toString();
        }
    }

    return item;
};

