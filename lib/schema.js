var Joi = require('joi');

var schema = Joi.object().keys({
    host: Joi.string().default('127.0.0.1'),
    port: Joi.number().default(8087),
    connect_timeout: Joi.number().default(1000),
    request_timeout: Joi.number().default(2000),
    idle_timeout: Joi.number().default(30000),
    min_connections: Joi.number().default(0),
    max_connections: Joi.number().default(10),
    parse_values: Joi.boolean().default(true)
});

exports.validate = function (options, callback) {

    Joi.validate(options || {}, schema, function (err, value) {

        if (err) {
            throw err;
        }

        callback(null, value);
    });
};
