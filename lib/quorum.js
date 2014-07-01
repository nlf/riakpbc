var quorums = ['pr', 'r', 'w', 'pw', 'dw', 'rw'];
var quorumMap = {
    '4294967294': 'one',
    one: 4294967294,
    '4294967293': 'quorum',
    quorum: 4294967293,
    '4294967292': 'all',
    all: 4294967292,
    '4294967291': 'default',
    default: 4294967291
};

exports.convert = function (props) {

    Object.keys(props).forEach(function (key) {

        if (~quorums.indexOf(key) && quorumMap[props[key]]) {
            props[key] = quorumMap[props[key]];
        }
    });

    return props;
};
