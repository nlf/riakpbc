var net = require('net');

function ConnectionManager(options) {
    // options
    this.host = options.host;
    this.port = options.port;
    this.timeout = options.timeout;
    this.auto_connect = options.auto_connect;

    // internal state
    this.connected = false;

    // the actual socket
    this.client = new net.Socket();
    this.client.on('end', this._disconnect.bind(this));
    this.client.on('error', this._disconnect.bind(this));
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
        // we assign this late so the client has a chance to override the receive method
        this.client.on('data', this.receive.bind(this));
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
    function send() {
        this.client.write(data);
    }

    if (this.auto_connect) {
        this.connect(function (err) {
            if (err) {
                return callback(err);
            }
            send.call(this);
            callback();
        }.bind(this));
    } else {
        if (!this.connected) {
            return callback(new Error('Not connected'));
        }
        send.call(this);
        callback();
    }
};

// Got data from the socket. This is a placeholder meant for the
// main library to override.
ConnectionManager.prototype.receive = function (data) {
};

module.exports = ConnectionManager;
