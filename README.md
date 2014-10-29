# RiakPBC [![build status](http://img.shields.io/travis/nlf/riakpbc/master.svg?style=flat-square)](http://travis-ci.org/nlf/riakpbc)[![Code Climate](http://img.shields.io/codeclimate/github/nlf/riakpbc.svg?style=flat-square)](https://codeclimate.com/github/nlf/riakpbc)[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/nlf/riakpbc?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

RiakPBC is a low-level [riak 2.0](http://basho.com/riak) [protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) client for [node.js](http://nodejs.org/).

# Contents
- [Installation](#installation)
- [Client](#client)
  - [Options](#options)
- [Usage](#usage)
- [Data Conversions](#data-conversions)
  - [bytes](#bytes)
  - [uint32/float](#uint32float)
  - [sint64](#sint64)
  - [enums](#enums)
  - [Embedded Messages](#embedded-messages)
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

### Options

The `options` object accepts the following parameters:

- `connectTimeout`: The timeout (in milliseconds) for creating a new connection. (Default: `1000`)
- `idleTimeout`: The amount of time (in milliseconds) that a node can be idle in the connection pool before it is released. (Default: `30000`)
- `maxLifetime`: The amount of time (in milliseconds) that a node is used in the connection pool before it is released, regardless of activity. (Default: `Infinity`)
- `minConnections`: The minimum number of connections to keep active in the connection pool. (Default: `0`)
- `maxConnections`: The maximum number of connections that may be active in the connection pool at any given time. (Default: `10`)
- `parseValues`: If set to `false`, values will be returned as buffers rather than strings or parsed JSON. (Default: `true`)
- `nodes`: An array of `{ host: 'string', port: number }` objects specifying all of the riak nodes to use. These are then load balanced via round-robin.
- `host`: If only connecting to a single node, you may specify the `host` property directly rather than passing an array of `nodes`. (Default: `'127.0.0.1'`)
- `port`: Again, if only connecting to a single node, you may specify the `port` directly. (Default: `8087`)
- `auth`: User and password, specified as a `{ user: 'string', password: 'string' }` object, to use for authentication if using [riak security](http://docs.basho.com/riak/latest/ops/running/authz/).

## Usage

For a full reference of all available methods, see the [API Reference](doc/API.md).

Methods that accept input have the signature `(params, callback)`, where `params` is an object containing the message to be sent to riak.

Methods that do not accept input have the signature `(callback)`.

Callbacks have the signature `(err, response)`.

If an error occurs, the `err` object will be a standard `Error` object wrapping the riak supplied [RpbErrorResp](doc/Messages.md#rpberrorresp) message.

If the call was successful, `response` will be the riak supplied message. Many calls do not return a value, or only return a value when certain flags are set, in these cases the `response` will be an empty object `{}`.

```javascript
client.ping(function (err, response) {
  if (err) {
    return console.error('Failed to ping:', err);
  }

  console.log(response); // {}
});
```

Note that callbacks are always optional, and if not supplied the call will return a stream instead.

These streams will emit only an `error` event if an error occurs. If the call is successful, the stream will emit one or more `data` events and an `end` event.
```javascript
var keys = client.getKeys({ bucket: 'test' });

keys.on('error', function (err) {
  console.error('An error occurred:', err);
});

keys.on('data', function (response) {
  console.log('Got some keys:', response.keys); // this could fire multiple times
});

keys.on('end', function () {
  console.log('Finished listing keys');
});
```

## Data Conversions

RiakPBC attempts to stay as accurate as possible when converting data to and from protocol buffer encoding.

All available messages are documented in the [Messages reference](doc/Messages.md).

The primary data types that riak uses are handled as follows:

### bytes

The `bytes` type may be supplied as either a `string` or a `Buffer`.

By default, when translating a response message these fields will be converted to a `string` unless they are the `vclock` or `context` properties. Since these values are intended to be binary only, they are left as a `Buffer`.

In the case of [RpbContent](doc/Messages.md#rpbcontent) values, RiakPBC will convert the `value` field to a string only if a `content_type` was set, and begins with the string `text` (as in `text/plain` or `text/xml`). In addition, if `content_type` is set to `application/json` RiakPBC will parse the value as JSON automatically.

This behavior can be overridden and `Buffer` objects returned for all `bytes` fields by setting `{ parseValues: false }` in your client options.

### uint32/float

These fields will always be treated as a plain javascript number.

### sint64

Since javascript does not properly handle 64 bit numbers, these are a special case.

When used as input, you may pass either a number (`42`), a string (`'-98549321293'`), or a [long.js](https://github.com/dcodeIO/Long.js) object.

In a reply, you will always receive a [long.js](https://github.com/dcodeIO/Long.js) object. These objects allow RiakPBC to properly support real 64 bit number values.

### bool

These fields will always be treated as a plain javascript boolean (i.e. `true` or `false`).

### enums

Several messages accept an enum field. RiakPBC exports these as variables on the main object to simplify input. They are as follows:

- IndexQueryType:
  - RiakPBC.IndexType.Exact
  - RiakPBC.IndexType.Range
- DataType:
  - RiakPBC.DataType.Counter
  - RiakPBC.DataType.Set
  - RiakPBC.DataType.Map
- MapFieldType:
  - RiakPBC.FieldType.Counter
  - RiakPBC.FieldType.Set
  - RiakPBC.FieldType.Register
  - RiakPBC.FieldType.Flag
  - RiakPBC.FieldType.Map
- FlagOp:
  - RiakPBC.Flag.Enable
  - RiakPBC.Flag.Disable

These variables are all simple numbers, however, so when RiakPBC returns a message containing one of these types you will receive a plain number. I would recommend using the exported variables for comparison purposes to maintain readable code.

### Embedded Messages

All other types not documented here are an embedded message and are recursively encoded/decoded in the same fashion as the above types.

## License

[The MIT License (MIT)](https://raw.githubusercontent.com/nlf/riakpbc/master/LICENSE)
