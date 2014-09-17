# RiakPBC
RiakPBC is a low-level [riak 2.0](http://basho.com/riak) [protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) client for [node.js](http://nodejs.org/).

[![build status](http://img.shields.io/travis/nlf/riakpbc/master.svg)](http://travis-ci.org/nlf/riakpbc)
[![NPM version](http://img.shields.io/npm/v/riakpbc.svg)](https://www.npmjs.org/package/riakpbc)
[![Code Climate](http://img.shields.io/codeclimate/github/nlf/riakpbc.svg)](https://codeclimate.com/github/nlf/riakpbc)

# Contents
- [Installation](#installation)
- [Client](#client)
  - [Client options](#client-options)
  - [Client methods](#client-methods)
- [Server methods](#server-methods)
  - [`client.ping([callback])`](#clientpingcallback)
  - [`client.getServerInfo([callback])`](#getserverinfocallback)
- [License](#license)


## Installation

```bash
npm install --save riakpbc
```

## Client

```javascript
var RiakPBC = require('riakpbc');
var client = RiakPBC.createClient(/* options */);
```

### Client options

The `options` object accepts the following parameters:

- `connectTimeout`: The timeout (in milliseconds) for creating a new connection. (Default: `1000`)
- `idleTimeout`: The amount of time (in milliseconds) that a node can be idle in the connection pool before it is released. (Default: `30000`)
- `minConnections`: The minimum number of connections to keep active in the connection pool. (Default: `0`)
- `maxConnections`: The maximum number of connections that may be active in the connection pool at any given time. (Default: `10`)
- `parseValues`: If set to `false`, values will be returned as buffers rather than strings or parsed JSON. (Default: `true`)
- `nodes`: An array of `{ host, port }` objects specifying all of the riak nodes to use. These are then load balanced via round-robin.
- `host`: If only connecting to a single node, you may specify the `host` property directly rather than passing an array of `nodes`. (Default: `'127.0.0.1'`)
- `port`: Again, if only connecting to a single node, you may specify the `port` directly. (Default: `8087`)
- `auth`: Username and password, specified as a `{ user, password }` object, to use for authentication if using [riak security](http://docs.basho.com/riak/latest/ops/running/authz/).

### Client methods

Methods that accept input (as detailed in the documentation below) have the signature `(params, callback)`, where `params` is an object containing the input to be sent to riak.

Every method on the client accepts an optional `callback` as the last parameter. The signature for the `callback` is `function (err, reply)`, where `err` will be defined when an error occurs and `reply` contains the decoded response from the riak node. Note that for many functions, by default, reply will be the empty object `{}`.

If a `callback` is not specified, the method will return a stream instead. You should assign listeners for the `error`, `data` and `end` events on that stream. If an error occurs, the `error` event will be emitted with an `err` object as its parameter. Otherwise, one or more `data` events will be emitted with a response object from the server. A final `end` event will be emitted when all `data` events have been sent.

## Server methods

### `client.ping(callback)`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/ping/)

Send a ping to the riak node. If successful `reply` will be the empty object `{}`.

```javascript
client.ping(function (err, reply) {
  if (err) {
    console.log('Failed to ping:', err);
  }
  else {
    console.log('Got a ping reply!');
  }
});
```

### `client.getServerInfo(callback)`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/server-info/)

Ask the riak node for general server information. If successful `reply` will be an object containing `node` and `server_version` properties.

```javascript
client.getServerInfo(function (err, reply) {
  console.log(reply); // { node: 'riak@127.0.0.1', server_version: '2.0.0' }
});
```


## License

[The MIT License (MIT)](https://raw.githubusercontent.com/nlf/riakpbc/master/LICENSE)
