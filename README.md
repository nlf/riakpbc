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
- [Bucket Operations](#bucket-operations)
  - [`client.getBuckets([callback])`](#clientgetbucketscallback)
  - [`client.getKeys(params, [callback])`](#clientgetkeysparams-callback)
  - [`client.getBucket(params, [callback])`](#clientgetbucketparams-callback)
  - [`client.setBucket(params, [callback])`](#clientsetbucketparams-callback)
  - [`client.resetBucket(params, [callback])`](#clientresetbucketparams-callback)
- [Object/Key Operations](#objectkey-operations)
  - [`client.get(params, [callback])`](#clientgetparams-callback)
  - [`client.put(params, [callback])`](#clientputparams-callback)
  - [`client.del(params, [callback])`](#clientdelparams-callback)
- [Query Operations](#query-operations)
  - [`client.mapred(params, [callback])`](#clientmapredparams-callback)
  - [`client.getIndex(params, [callback])`](#clientgetindexparams-callback)
  - [`client.search(params, [callback])`](#clientsearchparams-callback)
- [Server Operations](#server-operations)
  - [`client.ping([callback])`](#clientpingcallback)
  - [`client.getServerInfo([callback])`](#getserverinfocallback)
- [Bucket Type Operations](#bucket-type-operations)
  - [`client.getBucketType(params, [callback])`](#clientgetbuckettypeparams-callback)
  - [`client.setBucketType(params, [callback])`](#clientsetbuckettypeparams-callback)
- [Data Type Operations](#data-type-operations)
  - [`client.getCrdt(params, [callback])`](#clientgetcrdtparams-callback)
  - [`client.putCrdt(params, [callback])`](#clientputcrdtparams-callback)
- [Yokozuna Operations](#yokozuna-operations)
  - [`client.getSearchIndex(params, [callback])`](#clientgetsearchindexparams-callback)
  - [`client.putSearchIndex(params, [callback])`](#clientputsearchindexparams-callback)
  - [`client.delSearchIndex(params, [callback])`](#clientdelsearchindexparams-callback)
  - [`client.getSearchSchema(params, [callback])`](#clientgetsearchschemaparams-callback)
  - [`client.putSearchSchema(params, [callback])`](#clientputsearchschemaparams-callback)
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

## Bucket Operations

### `client.getBuckets([callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-buckets/)

**NOTE: Not recommended for use on production systems**

List all existing buckets.

**Input**: None

**Response**: If buckets exist, [RpbListBucketsResp](doc/Messages.md#rpblistbucketsresp), otherwise the empty object `{}`.

**Example**:
```javascript
client.getBuckets(function (err, reply) {
  console.log(reply); // { buckets: ['bucket_one', 'bucket_two'] }
});
```

### `client.getKeys(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-keys/)

**NOTE: Not recommended for use on production systems**

List all keys within a bucket. When used as a stream, this method will emit multiple `data` events.

**Input**: [RpbListKeysReq](doc/Messages.md#rpblistkeysreq)

**Response**: If the bucket contains keys, [RpbListKeysResp](doc/Messages.md#rpblistkeysresp), otherwise the empty object `{}`.

**Example**:
```javascript
client.getKeys({ bucket: 'test' }, function (err, reply) {
  console.log(reply); // { keys: ['key_one', 'key_two'] }
});
```

### `client.getBucket(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-props/)

Get a single bucket's properties.

**Input**: [RpbGetBucketReq](doc/Messages.md#rpbgetbucketreq)

**Response**: [RpbGetBucketResp](doc/Messages.md#rpbgetbucketresp)

**Example**:
```javascript
client.getBucket({ bucket: 'test' }, function (err, reply) {
  console.log(reply); // { props: { n_val: 3, allow_mult: false, … } }
});
```

### `client.setBucket(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-props/)

Set properties for a single bucket.

**Input**: [RpbSetBucketReq](doc/Messages.md#rpbsetbucketreq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

### `client.resetBucket(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/reset-bucket-props/)

**Input**: [RpbResetBucketReq](doc/Messages.md#rpbresetbucketreq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

## Object/Key Operations

### `client.get(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/fetch-object/)

**Input**: [RpbGetReq](doc/Messages.md#rpbgetreq)

**Response**: [RpbGetResp](doc/Messages.md#rpbgetresp)

**Example**:
```javascript
```

### `client.put(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/store-object/)

**Input**: [RpbPutReq](doc/Messages.md#rpbputreq)

**Response**: [RpbPutResp](doc/Messages.md#rpbputresp)

**Example**:
```javascript
```

### `client.del(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/delete-object/)

**Input**: [RpbDelReq](doc/Messages.md#rpbdelreq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

## Query Operations

### `client.mapred(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/mapreduce/)

**Input**: [RpbMapRedReq](doc/Messages.md#rpbmapredreq)

**Response**: [RpbMapRedResp](doc/Messages.md#rpbmapredresp)

**Example**:
```javascript
```

### `client.getIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/secondary-indexes/)

**Input**: [RpbIndexReq](doc/Messages.md#rpbindexreq)

**Response**: [RpbIndexResp](doc/Messages.md#rpbindexresp)

**Example**:
```javascript
```

### `client.search(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/search/)

**Input**: [RpbSearchQueryReq](doc/Messages.md#rpbsearchqueryreq)

**Response**: [RpbSearchQueryResp](doc/Messages.md#rpbsearchqueryresp)

**Example**:
```javascript
```

## Server Operations

### `client.ping(callback)`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/ping/)

Send a ping to the riak node.

**Input**: None

**Response**: The empty object `{}`.

**Example**:
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

Ask the riak node for general server information.

**Input**: None

**Response**: [RpbGetServerInfoResp](doc/Messages.md#rpbgetserverinforesp)

**Example**:
```javascript
client.getServerInfo(function (err, reply) {
  console.log(reply); // { node: 'riak@127.0.0.1', server_version: '2.0.0' }
});
```

## Bucket Type Operations

### `client.getBucketType(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-type/)

**Input**: [RpbGetBucketTypeReq](doc/Messages.md#rpbgetbuckettypereq)

**Response**: [RpbGetBucketTypeResp](doc/Messages.md#rpbgetbucketresp)

**Example**:
```javascript
```

### `client.setBucketType(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-type/)

**Input**: [RpbSetBucketTypeReq](doc/Messages.md#rpbsetbuckettypereq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

## Data Type Operations

### `client.getCrdt(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/dt-fetch/)

**Input**: [DtFetchReq](doc/Messages.md#dtfetchreq)

**Response**: [DtFetchResp](doc/Messages.md#dtfetchresp)

**Example**:
```javascript
```

### `client.putCrdt(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/dt-store/)

**Input**: [DtUpdateReq](doc/Messages.md#dtupdatereq)

**Response**: [DtUpdateResp](doc/Messages.md#dtupdateresp)

**Example**:
```javascript
```

## Yokozuna Operations

### `client.getSearchIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-index-get/)

**Input**: [RpbYokozunaIndexGetReq](doc/Messages.md#rpbyokozunaindexgetreq)

**Response**: [RpbYokozunaIndexGetResp](doc/Messages.md#rpbyokozunaindexgetresp)

**Example**:
```javascript
```

### `client.putSearchIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-index-put/)

**Input**: [RpbYokozunaIndexPutReq](doc/Messages.md#rpbyokozunaindexputreq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

### `client.delSearchIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-index-delete/)

**Input**: [RpbYokozunaIndexDeleteReq](doc/Messages.md#rpbyokozunaindexdeletereq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

### `client.getSearchSchema(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-schema-get/)

**Input**: [RpbYokozunaSchemaGetReq](doc/Messages.md#rpbyokozunaschemagetreq)

**Response**: [RpbYokozunaSchemaGetResp](doc/Messages.md#rpbyokozunaschemagetresp)

**Example**:
```javascript
```

### `client.putSearchSchema(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-schema-put/)

**Input**: [RpbYokozunaSchemaPutReq](doc/Messages.md#rpbyokozunaschemaputreq)

**Response**: The empty object `{}`

**Example**:
```javascript
```

## License

[The MIT License (MIT)](https://raw.githubusercontent.com/nlf/riakpbc/master/LICENSE)
