var Joi = require('joi');

var schema = Joi.object().keys({
    host: Joi.string().default('127.0.0.1'),
    port: Joi.number().default(8087),
    nodes: Joi.array().includes(Joi.object().keys({
        host: Joi.string().default('127.0.0.1'),
        port: Joi.number().default(8087)
    })),
    auth: Joi.object().keys({
        user: Joi.string(),
        password: Joi.string()
    }).and('user', 'password'),
    connectTimeout: Joi.number().default(1000),
    idleTimeout: Joi.number().default(30000),
    maxLifetime: Joi.number().default(Infinity),
    minConnections: Joi.number().default(0),
    maxConnections: Joi.number().default(10),
    parseValues: Joi.boolean().default(true)
}).without('nodes', ['host', 'port']);

exports.validate = function (options, callback) {

    Joi.validate(options || {}, schema, function (err, value) {

        if (err) {
            throw err;
        }

        if (!value.nodes) {
            value.nodes = [{ host: value.host, port: value.port }];
            delete value.host;
            delete value.port;
        }

        callback(null, value);
    });
};
