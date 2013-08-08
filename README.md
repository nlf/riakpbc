[![build status](https://secure.travis-ci.org/nlf/riakpbc.png)](http://travis-ci.org/nlf/riakpbc)
[![Dependency Status](https://gemnasium.com/natural/riakpbc.png)](https://gemnasium.com/natural/riakpbc)
[![NPM version](https://badge.fury.io/js/riakpbc.png)](http://badge.fury.io/js/riakpbc)

## RiakPBC
RiakPBC is a low-level [Riak 1.4](http://basho.com/riak)
[protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) client for
[Node.js](http://nodejs.org/).

All of the API methods documented at
[basho docs](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/)
are implemented.


#### Contents

  * [Install](#install)
  * [Usage](#usage)
  * [API](#api)
    * [Bucket Operations](#bucket-ops)
    * [Object/Key Operations](#key-ops)
    * [Query Operations](#query-ops)
    * [Server Operations](#server-ops)


<a id="install"></a>
#### Install

Installation is easy with NPM:

```sh
$ npm install riakpbc --save
```


<a id="usage"></a>
#### Usage

Make sure you've got a working Riak install, then connect to it like this:

```javascript
var riakpbc = require('riakpbc'),
    client = riakpbc.createClient();
```

You can specify host and port in the connection if your Riak server isn't local
or if it's running on a different port:

```javascript
var client = riakpbc.createClient({host: 'riak.somewhere-else.com', port: 8086});
```

From there, making calls to Riak is easy; you call methods on it, typically with
a hash of options and a callback.  Inside the callback, you handle the response
from Riak.  Refer to the [API](#api) section below for the details of each call.

<a id="api"></a>
#### API

<a id="bucket-ops"></a>
##### Query Operations

###### `client.getBuckets(callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-buckets/)

This method retrieves a list of buckets available on the server.  You should't
run this in production.  But here in documentation land, we demonstrate:

This method takes no parameters, only a callback.

```javascript
client.getBuckets(function (reply) {
  var buckets = reply.buckets;
  console.log('i have buckets:', buckets);
});
```

The callback will receive an object like this:

```javascript
{ buckets: [ 'chicken', 'ice-cream', 'jelly-beans' ] }
```

###### `client.getBucket(params, callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-props/)

This call retrieves the property of a bucket.  Specify the name of the
bucket in the `params`.

The `params` object should have only one key, `bucket`, and its
value should be the bucket name as a string.

Example:

```javascript
client.getBucket({ bucket: 'test'}, function (reply) {
  console.log('test bucket:', reply);
});
```

This will output something like this:

```javascript
{ props:
   { n_val: 3,
     allow_mult: false,
     last_write_wins: false,
     has_precommit: true,
     has_postcommit: true,
     chash_keyfun: { module: 'riak_core_util', function: 'chash_std_keyfun' },
     linkfun:
      { module: 'riak_kv_wm_link_walker',
        function: 'mapreduce_linkfun' },
     old_vclock: 86400,
     young_vclock: 20,
     big_vclock: 50,
     small_vclock: 50,
     pr: 0,
     r: -3,
     w: 33554431,
     pw: 33554431,
     rw: 33554431,
     basic_quorum: false } }
```

###### `client.setBucket(params, callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-props/)

This method changes the bucket properties.  Available `params`:

  * `bucket` - the name of the bucket
  * `props` - an object with the properties to set; see the Riak PBC docs for
    valid keys and values

The callback response will be empty on success.

###### `client.resetBucket(params, callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/http/reset-bucket-props/)


This method resets the bucket properties to their defaults.  Available `params`:

  * `bucket` - the name of the bucket

The callback response will be empty on success.


###### `client.getKeys(params, [streaming], callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-keys/)

This method retrieves keys from the specified bucket.  Don't use it in
production.

The first form retrieves the keys in one call:

```javascript
client.getKeys({ bucket: 'test'}, function (response) {
  var keys = response.keys;
  keys.forEach(function (key) {
    console.log('key: %s', key)
  });
});
```

The second form returns an event emitter:

```javascript
client.getKeys({ bucket: 'test' }, true).on('data', function (reply) {
  console.log('batch of keys:', reply.keys);
});
```

<a id="key-ops"></a>
##### Object/Key Operations

###### `client.get(params, callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/fetch-object/)

This method fetches an object from Riak.  Example:

```javascript
client.get({ bucket: 'test', key: 'the-ballad-of-john-henry' }, function (response) {
  console.log('found song:', response.content.value);
});
```

###### `client.put(params, callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/store-object/)

This method sends data to Riak for storage.  Use it like this:

```javascript
var song = { title: 'Jockey Full of Bourbon', writer: 'Tom Waits', performer: 'Joe Bonamassa' },
    request = { bucket: 'test', key: 'bourbon', content: { value: JSON.stringify(song), content_type: 'application/json' } };
client.put(request, function (reply) {
  console.log(reply);
});
```

The reply will be empty unless the `return_body` key is set to `true`.  In that
case, the response will be similar to the response of a `get` response.

The request can contain a `vclock` key, which typically comes from a `get`
request or a `put` request with `return_body: true`.  You should send the
`vclock` to help Riak resolve conflicts.  See the
[Vector Clocks](http://docs.basho.com/riak/latest/theory/concepts/Vector-Clocks/)
documentation for an introduction to vector clocks.


###### `client.del(params, callback)`

[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/delete-object/)

This method removes a key from a bucket.  Like this:

```
client.del({ bucket: 'test', song: 'thriller' }, function (response) {
  console.log('it was totally overrated.');
});
```




<a id="query-ops"></a>
##### Query Operations

<a id="server-ops"></a>
##### Server Operations
