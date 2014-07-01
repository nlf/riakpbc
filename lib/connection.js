var net = require('net');
var Protobuf = require('protobuf.js');
var riakproto = require('riakproto');
var _merge = require('./merge');
var Parser = require('./parser');

function ConnectionManager(options) {

    // options
    this.host = options.host;
    this.port = options.port;
    this.timeout = options.timeout;
    // this.auto_connect = options.auto_connect;
    this.parse_values = options.hasOwnProperty('parse_values') ? options.parse_values : true;

    // internal state
    this.connected = false;
    this.readBuf = new Buffer(256 * 1024);
    this.readBufPos = 0;
    this.queue = [];
    this.reply = {};

    // the actual socket
    this.client = new net.Socket();
    this.client.on('end', this._disconnect.bind(this));
    this.client.on('error', this._disconnect.bind(this));
    this.client.on('data', this._receive.bind(this));

    // protocol buffer translator
    this.translator = new Protobuf(riakproto);
}

// Connect the socket, call the callback when complete.
// If the socket does not connect within self.timeout milliseconds
// call the callback with an error instead.
ConnectionManager.prototype.connect = function (callback) {

    if (this.connected) {
        return callback();
    }

    // var timeoutGuard;
    //
    // timeoutGuard = setTimeout(function () {
    //
    //     callback(new Error('Connection timeout'));
    // }, this.timeout);

    this.client.connect(this.port, this.host, function () {

        // clearTimeout(timeoutGuard);
        this.connected = true;
        callback();
    }.bind(this));
};

// Private disconnect method, this is what the 'end' and 'error'
// events call directly to make sure internal state is maintained
ConnectionManager.prototype._disconnect = function (callback) {

    if (!this.connected) {
        return;
    }

    this.client.end();
    this.connected = false;

    if (typeof callback === 'function') {
        callback();
    }
};

// Public disconnect method. When this is called we explicitly set
// the auto_connect option to false to prevent future automatic reconnects
ConnectionManager.prototype.disconnect = function (callback) {

    // this.auto_connect = false;
    this._disconnect(callback);
};

// Write data to the socket
ConnectionManager.prototype.send = function (data, callback) {

    var self = this;

    // if (self.auto_connect && !self.connected) {
        self.connect(function (err) {

            if (err) {
                return callback(err);
            }
            self.client.write(data, callback);
        });
    // } else {
    //     if (!self.connected) {
    //         return callback(new Error('Not connected'));
    //     }
    //     self.client.write(data, callback);
    // }
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

    if (this.readBufPos) {
        if (this.readBuf.length < data.length + this.readBufPos) {
            this._growReadBuffer(data.length + this.readBufPos);
        }
        data.copy(this.readBuf, this.readBufPos);
        this.readBufPos += data.length;
        data = this.readBuf.slice(0, this.readBufPos);
    }

    length = data.length < 4 ? 0 : data.readInt32BE(0);

    if (data.length < 4 + length) {
        if (this.readBufPos === 0) {
            if (this.readBuf.length < 4 + length) {
                this._growReadBuffer(4 + length);
            }
            data.copy(this.readBuf);
            this.readBufPos += data.length;
        }
        return;
    }

    this.readBufPos = 0;

    this._processMessage(data.slice(4, length + 4));

    if (data.length > 4 + length) {
        this._receive(data.slice(length + 4));
    }
};

ConnectionManager.prototype._cleanup = function (err, reply) {

    this.reply = {};

    if (this.task.callback) {
        this.task.callback(err, reply);
    } else {
        if (err) {
            this.task.stream.emit('error', err);
        } else {
            this.task.stream.end();
        }
    }

    this.task = undefined;
    this._processNext();
};

ConnectionManager.prototype._processNext = function (callback) {

    var self = this;

    callback = callback || function () {};
    if (!self.queue.length || self.task) {
        return;
    }

    self.task = self.queue.shift();

    self.send(self.task.message, function (err) {

        if (err) {
            if (self.task.callback) {
                self.task.callback(err);
            } else {
                self.task.stream.emit('error', err);
            }
            return callback(err);
        }

        callback();
    });
};

ConnectionManager.prototype._processMessage = function (data) {

    if (!this.task) {
        return this._processNext();
    }

    var response, messageCode, err, done;

    messageCode = riakproto.codes['' + data[0]];
    response = this.translator.decode(messageCode, data.slice(1));

    if (!response) {
        err = new Error('Failed to decode response message');

        return this._cleanup(err);
    }

    response = Parser.parse(response, this.parse_values);

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
    } else if (Object.keys(response).length) {
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
    } else {
        buffer = new Buffer(0);
    }

    message = new Buffer(buffer.length + 5);
    message.writeInt32BE(buffer.length + 1, 0);
    message.writeInt8(riakproto.codes[options.type], 4);
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
