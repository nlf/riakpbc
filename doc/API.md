# API
- [Bucket Operations](#bucket-operations)
  - [`client.getBuckets(params, [callback])`](#clientgetbucketscallback)
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

## Bucket Operations

### `client.getBuckets([callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-buckets/)

**NOTE: Not recommended for use on production systems**

List all existing buckets.

**Input**: None

**Response**: If buckets exist, [RpbListBucketsResp](doc/Messages.md#rpblistbucketsresp), otherwise the empty object `{}`.

### `client.getKeys(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-keys/)

**NOTE: Not recommended for use on production systems**

List all keys within a bucket. When used as a stream, this method will emit multiple `data` events.

**Input**: [RpbListKeysReq](doc/Messages.md#rpblistkeysreq)

**Response**: If the bucket contains keys, [RpbListKeysResp](doc/Messages.md#rpblistkeysresp), otherwise the empty object `{}`.

### `client.getBucket(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-props/)

Get a single bucket's properties.

**Input**: [RpbGetBucketReq](doc/Messages.md#rpbgetbucketreq)

**Response**: [RpbGetBucketResp](doc/Messages.md#rpbgetbucketresp)

### `client.setBucket(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-props/)

Set properties for a single bucket.

**Input**: [RpbSetBucketReq](doc/Messages.md#rpbsetbucketreq)

**Response**: The empty object `{}`

### `client.resetBucket(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/reset-bucket-props/)

**Input**: [RpbResetBucketReq](doc/Messages.md#rpbresetbucketreq)

**Response**: The empty object `{}`

## Object/Key Operations

### `client.get(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/fetch-object/)

**Input**: [RpbGetReq](doc/Messages.md#rpbgetreq)

**Response**: [RpbGetResp](doc/Messages.md#rpbgetresp)

### `client.put(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/store-object/)

**Input**: [RpbPutReq](doc/Messages.md#rpbputreq)

**Response**: [RpbPutResp](doc/Messages.md#rpbputresp)

### `client.del(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/delete-object/)

**Input**: [RpbDelReq](doc/Messages.md#rpbdelreq)

**Response**: The empty object `{}`

## Query Operations

### `client.mapred(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/mapreduce/)

**Input**: [RpbMapRedReq](doc/Messages.md#rpbmapredreq)

**Response**: [RpbMapRedResp](doc/Messages.md#rpbmapredresp)

### `client.getIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/secondary-indexes/)

**Input**: [RpbIndexReq](doc/Messages.md#rpbindexreq)

**Response**: [RpbIndexResp](doc/Messages.md#rpbindexresp)

### `client.search(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/search/)

**Input**: [RpbSearchQueryReq](doc/Messages.md#rpbsearchqueryreq)

**Response**: [RpbSearchQueryResp](doc/Messages.md#rpbsearchqueryresp)

## Server Operations

### `client.ping(callback)`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/ping/)

Send a ping to the riak node.

**Input**: None

**Response**: The empty object `{}`.

### `client.getServerInfo(callback)`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/server-info/)

Ask the riak node for general server information.

**Input**: None

**Response**: [RpbGetServerInfoResp](doc/Messages.md#rpbgetserverinforesp)

## Bucket Type Operations

### `client.getBucketType(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-type/)

**Input**: [RpbGetBucketTypeReq](doc/Messages.md#rpbgetbuckettypereq)

**Response**: [RpbGetBucketTypeResp](doc/Messages.md#rpbgetbucketresp)

### `client.setBucketType(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-type/)

**Input**: [RpbSetBucketTypeReq](doc/Messages.md#rpbsetbuckettypereq)

**Response**: The empty object `{}`

## Data Type Operations

### `client.getCrdt(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/dt-fetch/)

**Input**: [DtFetchReq](doc/Messages.md#dtfetchreq)

**Response**: [DtFetchResp](doc/Messages.md#dtfetchresp)

### `client.putCrdt(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/dt-store/)

**Input**: [DtUpdateReq](doc/Messages.md#dtupdatereq)

**Response**: [DtUpdateResp](doc/Messages.md#dtupdateresp)

## Yokozuna Operations

### `client.getSearchIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-index-get/)

**Input**: [RpbYokozunaIndexGetReq](doc/Messages.md#rpbyokozunaindexgetreq)

**Response**: [RpbYokozunaIndexGetResp](doc/Messages.md#rpbyokozunaindexgetresp)

### `client.putSearchIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-index-put/)

**Input**: [RpbYokozunaIndexPutReq](doc/Messages.md#rpbyokozunaindexputreq)

**Response**: The empty object `{}`

### `client.delSearchIndex(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-index-delete/)

**Input**: [RpbYokozunaIndexDeleteReq](doc/Messages.md#rpbyokozunaindexdeletereq)

**Response**: The empty object `{}`

### `client.getSearchSchema(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-schema-get/)

**Input**: [RpbYokozunaSchemaGetReq](doc/Messages.md#rpbyokozunaschemagetreq)

**Response**: [RpbYokozunaSchemaGetResp](doc/Messages.md#rpbyokozunaschemagetresp)

### `client.putSearchSchema(params, [callback])`
[API Reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/yz-schema-put/)

**Input**: [RpbYokozunaSchemaPutReq](doc/Messages.md#rpbyokozunaschemaputreq)

**Response**: The empty object `{}`
