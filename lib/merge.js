module.exports = function _merge(obj1, obj2) {
    var obj = {};
    if (obj2.hasOwnProperty('phase')) {
        obj = obj1;
        if (obj[obj2.phase] === undefined) {
            obj[obj2.phase] = [];
        }
        obj[obj2.phase] = obj[obj2.phase].concat(JSON.parse(obj2.response));
    } else {
        [obj1, obj2].forEach(function (old) {
            Object.keys(old).forEach(function (key) {
                if (!old.hasOwnProperty(key)) {
                    return;
                }
                if (Array.isArray(old[key])) {
                    if (!obj[key]) {
                        obj[key] = [];
                    }
                    obj[key] = obj[key].concat(old[key]);
                } else {
                    obj[key] = old[key];
                }
            });
        });
    }
    return obj;
};

