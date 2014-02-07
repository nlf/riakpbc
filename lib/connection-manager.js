var net = require('net');

function ConnectionManager(options) {
    // options
    this.host = options.host;
    this.port = options.port;
    this.timeout = options.timeout;
    this.auto_connect = options.auto_connect;

    // internal state
    this.connected = false;
    this.readBuf = new Buffer(256 * 1024);
    this.readBufPos = 0;

    // the actual socket
    this.client = new net.Socket();
    this.client.on('end', this._disconnect.bind(this));
    this.client.on('error', this._disconnect.bind(this));
    this.client.on('data', this._receive.bind(this));
}

// Connect the socket, call the callback when complete.
// If the socket does not connect within self.timeout milliseconds
// call the callback with an error instead.
ConnectionManager.prototype.connect = function (callback) {
    if (this.connected) {
        return callback();
    }

    var timeoutGuard;

    timeoutGuard = setTimeout(function () {
        callback(new Error('Connection timeout'));
    }, this.timeout);

    this.client.connect(this.port, this.host, function () {
        clearTimeout(timeoutGuard);
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
    this.auto_connect = false;
    this._disconnect(callback);
};

// Write data to the socket
ConnectionManager.prototype.send = function (data, callback) {
    var self = this;

    if (self.auto_connect && !self.connected) {
        self.connect(function (err) {
            if (err) {
                return callback(err);
            }
            self.client.write(data, callback);
        });
    } else {
        if (!self.connected) {
            return callback(new Error('Not connected'));
        }
        self.client.write(data, callback);
    }
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

    this.receive(data.slice(4, length + 4));

    if (data.length > 4 + length) {
        this._receive(data.slice(length + 4));
    }
};

module.exports = ConnectionManager;
