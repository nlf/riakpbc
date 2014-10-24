var net = require('net');
var tls = require('tls');
var Protobuf = require('protobuf.js');
var riakproto = require('riakproto');
var _merge = require('./merge');
var Parser = require('./parser');

function ConnectionManager(options) {

    // options
    this.host = options.host;
    this.port = options.port;
    this.connectTimeout = options.connectTimeout;
    this.parseValues = options.parseValues;
    this.auth = options.auth;

    // internal state
    this.readBuf = new Buffer(256 * 1024);
    this.readBufPos = 0;
    this.queue = [];
    this.reply = {};

    // the actual socket
    this.client = new net.Socket();
    this.client.on('error', function () {}); // no-op since node fires 'close' immediately after error anyway
    this.client.on('close', this.disconnect.bind(this));
    this.client.on('data', this._receive.bind(this));

    // protocol buffer translator
    this.translator = new Protobuf(riakproto);
}

// Connect the socket, call the callback when complete.
// If the socket does not connect within self.timeout milliseconds
// call the callback with an error instead.
ConnectionManager.prototype.connect = function (callback) {

    var once = false;
    var cb = function () {

        // Manually disable coverage here, since this requires some
        // pretty close timing and can't be tested reliably
        /* $lab:coverage:off$ */
        if (!once) {
            once = true;
            callback.apply(null, arguments);
        }
        /* $lab:coverage:on$ */
    };

    var timeoutGuard = setTimeout(function () {

        cb(new Error('Connection timeout'));
    }, this.connectTimeout);

    this.client.connect(this.port, this.host, function () {

        clearTimeout(timeoutGuard);

        if (!this.auth) {
            return cb();
        }

        this._upgrade(cb);
    }.bind(this));
};

// Public disconnect method
ConnectionManager.prototype.disconnect = function () {

    // destroy the socket, this invalidates it for the connection pool
    this.client.destroy();
};

ConnectionManager.prototype._upgrade = function (callback) {

    this.makeRequest({
        type: 'RpbStartTls',
        callback: function (err) {

            if (err) {
                return callback(err);
            }

            this.client.removeAllListeners('data');
            this.client.removeAllListeners('error');
            this.client.removeAllListeners('end');

            this.client = tls.connect({
                socket: this.client,
                rejectUnauthorized: false
            }, function () {

                this.makeRequest({
                    type: 'RpbAuthReq',
                    params: this.auth,
                    callback: callback
                });
            }.bind(this));

            this.client.on('end', this.disconnect.bind(this));
            this.client.on('error', this.disconnect.bind(this));
            this.client.on('data', this._receive.bind(this));
        }.bind(this)
    });
};

// Write data to the socket
ConnectionManager.prototype.send = function (data, callback) {

    this.client.write(data, callback);
};

ConnectionManager.prototype._growReadBuffer = function (newLength) {

    var _b = new Buffer(newLength);
    this.readBuf.copy(_b, 0, 0, this.readBufPos);
    this.readBuf = _b;
};

// Got data from the socket. We make sure to split it into the correct
// sizes and call the client assigned receive function on each chunk
ConnectionManager.prototype._receive = function (data) {

    var length;

    // Make sure we can accomodate the incoming data
    if (this.readBuf.length < this.readBufPos + data.length) {
        this._growReadBuffer(this.readBufPos + data.length);
    }

    // If we have data in the read buffer already, append and
    // replace this `data` with the entirety of the buffer
    if (this.readBufPos) {
        data.copy(this.readBuf, this.readBufPos);
        this.readBufPos += data.length;
        data = this.readBuf.slice(0, this.readBufPos);
    }

    // If we don't have enough data to even constitute the `length` bit from the
    // protocol, we're going to have to wait for more data
    if (data.length < 4) {
        // Accomodate in read buffer
        this._growReadBuffer(this.readBufPos + data.length);
        data.copy(this.readBuf, this.readBufPos);
        this.readBufPos += data.length;
        // Wait for the rest of the message...
        return;
    }

    // Read the protocol `message length`
    length = data.readInt32BE(0);

    // If the current read buffer has less data
    // than the protocol message *should* have, copy and wait for more
    if (data.length < 4 + length) {
        // If the buffer read position is > 0,
        // then we have already appended it above.
        if (this.readBufPos === 0) {
            this._growReadBuffer(4 + length);
            data.copy(this.readBuf);
            this.readBufPos += data.length;
        }

        return;
    }

    this.readBufPos = 0;

    this._processMessage(data.slice(4, length + 4));

    // Manually disable coverage here, since this code only
    // runs in the event that riak "decides" to send two messages
    // at once
    /* $lab:coverage:off$ */
    if (data.length > 4 + length) {
        this._receive(data.slice(length + 4));
    }
    /* $lab:coverage:on$ */
};

ConnectionManager.prototype._cleanup = function (err, reply) {

    this.reply = {};

    if (this.task.callback) {
        this.task.callback(err, reply);
    }
    else {
        if (err) {
            this.task.stream.emit('error', err);
        }
        else {
            this.task.stream.end();
        }
    }

    this.task = undefined;
};

ConnectionManager.prototype._processNext = function (callback) {

    callback = callback || function () {};
    if (this.task) {
        // Yield to IO and try again
        setImmediate(this._processNext.bind(this), callback);
    }
    else {
        this.task = this.queue.shift();
        this.send(this.task.message, callback);
    }
};

ConnectionManager.prototype._processMessage = function (data) {

    var response, messageCode, err, done;

    messageCode = riakproto.codes['' + data[0]];
    response = this.translator.decode(messageCode, data.slice(1));

    response = Parser.parse(response, this.parseValues);

    if (response.errmsg) {
        err = new Error(response.errmsg);
        err.code = response.errcode;

        return this._cleanup(err);
    }

    if (response.done) {
        done = true;
        delete response.done;
    }

    if (this.task.callback) {
        this.reply = _merge(this.reply, response);
    }
    else if (Object.keys(response).length) {
        this.task.stream.write(response);
    }

    if (done || !this.task.expectMultiple || messageCode === 'RpbErrorResp') {
        this._cleanup(undefined, this.reply);
    }
};

// ConnectionManager.prototype.makeRequest = function (type, data, callback, expectMultiple, streaming) {
ConnectionManager.prototype.makeRequest = function (options, callback) {

    var buffer, message;

    if (riakproto.messages[options.type]) {
        buffer = this.translator.encode(options.type, options.params);
    }
    else {
        buffer = new Buffer(0);
    }

    message = new Buffer(buffer.length + 5);
    message.writeInt32BE(buffer.length + 1, 0);
    message.writeUInt8(riakproto.codes[options.type], 4);
    buffer.copy(message, 5);

    this.queue.push({
        message: message,
        callback: options.callback,
        expectMultiple: options.expectMultiple,
        stream: options.stream
    });

    this._processNext(callback);
};

module.exports = ConnectionManager;