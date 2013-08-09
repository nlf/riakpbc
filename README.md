[![build status](https://secure.travis-ci.org/nlf/riakpbc.png)](http://travis-ci.org/nlf/riakpbc)
[![NPM version](https://badge.fury.io/js/riakpbc.png)](http://badge.fury.io/js/riakpbc)
[![Dependency Status](https://gemnasium.com/natural/riakpbc.png)](https://gemnasium.com/natural/riakpbc)

# RiakPBC
RiakPBC is a low-level [Riak 1.4](http://basho.com/riak)
[protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) client for
[Node.js](http://nodejs.org/).  RiakPBC implements all of the API methods listed in the
[Basho Riak Documentation](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/).


## Contents
  * [Install](#install)
  * [Usage](#usage)
  * [API](#api)
    * [Bucket Methods](#bucket-methods)
    * [Object/Key Methods](#objectkey-methods)
    * [Query Methods](#query-methods)
    * [Server Methods](#server-methods)
    * [Connection Methods](#connection-methods)
  * [License](#license)


<a id="install"></a>
### Install

Installation is easy:
```sh
$ npm install riakpbc --save
```


<a id="usage"></a>
### Usage
Make sure you've got a working Riak server and then connect to it in your
program like this:

```javascript
var riakpbc = require('riakpbc'),
    client = riakpbc.createClient();
```

You can specify host and port if your Riak server isn't local or if it's running
on a different port:

```javascript
var client = riakpbc.createClient({host: 'riak.somewhere-else.com', port: 8086});
```


<a id="api"></a>
## API

Making requests to Riak is straight-forward.  You call methods on the client,
typically with a hash of options and a callback.  Inside the callback, you
handle the response from Riak.

The descriptions and examples below show the minimal arguments needed to
complete each call.  In many cases, the `params` object can have additional keys
and values to change the way the server handles and responds to the request.
Follow the reference links to the official Basho docs for the details of each
set of parameters .  You should also be familiar with the Riak
[CAP Controls](http://docs.basho.com/riak/latest/dev/advanced/cap-controls/).


<a id="bucket-methods"></a>
## Bucket Methods


#### `client.getBuckets(callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-buckets/)

This method retrieves a list of buckets available on the server.  You shouldn't
run this in production.  This method takes no parameters, only a callback.

```javascript
client.getBuckets(function (reply) {
  var buckets = reply.buckets;
  console.log('we have buckets:', buckets);
});
```

The callback will receive an object with a key `buckets` that has a value of an
array of bucket names, each a string:

```javascript
{ buckets: [ 'chicken', 'ice-cream', 'jelly-beans' ] }
```


#### `client.getBucket(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-props/)

This call retrieves the properties of a bucket.  The `params` object should have
only one key, `bucket`, and its value should be the bucket name as a
string. Example:

```javascript
client.getBucket({ bucket: 'test' }, function (reply) {
  console.log('bucket properties:', reply.props);
});
```

This will output something like this:

```javascript
{ props:
   { n_val: 3,
     allow_mult: false,
     last_write_wins: false,
     has_precommit: true,
     ... } }
```


#### `client.setBucket(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-props/)

This method changes the bucket properties.  Supply the bucket name via `bucket`
and properties via `props`.  Example:

```javascript
client.setBucket({ bucket: 'test', props: { allow_mult: true }}, function (reply) {
  if (!reply.errmsg) {
    console.log('bucket allows multiple versions.');
  }
});
```
The callback response will be empty on success.


#### `client.resetBucket(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/http/reset-bucket-props/)

This method resets the bucket properties to default values.  Supply a bucket
name in the `params`:

```javascript
client.resetBucket({ bucket: 'test' }, function (reply) {
  if (!reply.errmsg) {
    console.log('bucket properties restored.');
  }
});
```
The callback response will be empty on success.


#### `client.getKeys(params, [streaming], callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-keys/)

This method retrieves keys from the specified bucket.  Don't use it in
production.

The first form retrieves the keys in one call:

```javascript
client.getKeys({ bucket: 'test' }, function (reply) {
  var keys = reply.keys;
  keys.forEach(function (key) {
    console.log('key:', key)
  });
});
```

The second form returns an event emitter that receives is streamed keys:

```javascript
client.getKeys({ bucket: 'test' }, true).on('data', function (reply) {
  console.log('batch of keys:', reply.keys);
});
```


<a id="objectkey-methods"></a>
## Object/Key Methods

#### `client.get(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/fetch-object/)

This method fetches an object from Riak.  Example:

```javascript
client.get({ bucket: 'test', key: 'the-ballad-of-john-henry' }, function (reply) {
  console.log('found song:', reply.content.value);
});
```


#### `client.put(params, callback)`
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
case, the response will be similar to a `get` response.

The request can contain a `vclock` key, which typically comes from a `get`
request or a `put` request with `return_body: true`.  You should send the
`vclock` to help Riak resolve conflicts.  See the
[Vector Clocks](http://docs.basho.com/riak/latest/theory/concepts/Vector-Clocks/)
documentation for an introduction to vector clocks.


#### `client.del(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/delete-object/)

This method removes a key from a bucket.  Specify the bucket and the key:

```javascript
client.del({ bucket: 'test', song: 'thriller' }, function (reply) {
  console.log('it was totally overrated.');
});
```


#### `client.updateCounter(params, callback)`
(no reference docs)

This method sets or updates a counter (a nifty type of
[CRDT](http://pagesperso-systeme.lip6.fr/Marc.Shapiro/papers/RR-6956.pdf)).
Make sure you pass in a key `amount` with an integer value; the counter will be
incremented by that value.  You can pass in `returnvalue: true` to fetch the
updated counter.

NB: the bucket containing the key must have the property `allow_mult` set to
`true`.

```javacript
client.updateCounter({ bucket: 'test', key: 'times-i-mispell-definitely', amount: 31415 }, function (reply) {
  console.log('how bad is it? this many:', reply.value);
});
```


#### `client.getCounter(params, callback)`
(no reference docs)

This method gets a counter value.  Specify the name of the bucket and key in the
`params` object.  Example:

```javacript
client.getCounter({ bucket: 'test', key: 'times-i-mispell-definitely' }, function (reply) {
  console.log('how bad is it? this many:', reply.value);
});
```


<a id="query-methods"></a>
## Query Methods

#### `client.mapred(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/mapreduce/)

This method invokes a map reduce query on the Riak server.  The parameters to
the method aren't as simple as most, so it's easier to see what's going on if
you break down the objects into smaller chunks.

```javascript
var request = {
  inputs: [["test", "test"]],  // array [bucket, key] or [bucket, key, keydata]
  query: [
    {
      map: {
        source: 'function (v) { return [[v.bucket, v.key]]; }',
        language: 'javascript',
        keep: true
      }
    },
    {
      map: {
        name: 'Riak.mapValuesJson',
        language: 'javascript',
        keep: true
      }
    }
    ]
};
```

With the request object, writing the map reduce call is more clear:

```javascript
client.mapred({ request: JSON.stringify(request), content_type: 'application/json' }, function (reply) {
  console.log('first map reduce reply: %s', reply[0]);
});
```
See the tutorial page
[Loading Data and Running MapReduce](http://docs.basho.com/riak/latest/tutorials/fast-track/Loading-Data-and-Running-MapReduce-Queries/)
and the
[Advanced MapReduce](http://docs.basho.com/riak/latest/dev/advanced/mapreduce/)
doc for more details and examples.


#### `client.getIndex(query, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/secondary-indexes/)

This method makes a secondary index query on the server.  Supply a bucket, an
index, and a query type:

```javascript
var query = { bucket: 'friends', index: 'name_bin', qtype: 0, key: 'Joe' };
client.getIndex(query, function (reply) {
  console.log('found keys:', reply.keys);
});
```

With the `qtype` 0, you must supply `key`, with `qtype` 1, you must supply
`range_min` and `range_max` values.

NB: 2i index queries only work when the index exists.  Pass an `indexes` array
as part of your `put` calls to index objects as they're stored:

```javascript
client.put({ bucket: '...', key: '..', content: { value: '...', indexes: [{ key: 'friends_bin', value: user.first_name }] } }, ...) function (...) {
  ...
});
```


#### `client.search(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/search/)

This method sends a search request to the server.  Specify the index name with
the `index` key and the query with the `q` key.  Example:

```javascript
client.search({ index: 'test', q: 'name:john' }, function (reply) {
  console.log('searched and found:', reply);
});
```


<a id="server-methods"></a>
## Server Methods


#### `client.ping(callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/ping/)

This method can be used to test availability of the server.  This method takes
no parameters, only a callback.

```javascript
client.ping(function (reply) {
  if (!reply.errmsg) {
    console.log('pong')
  }
});
```


#### `client.setClientId(params, callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-client-id/)

This method sets the client identifier, which helps the server resolve conflicts
and reduce vector clock bloat.

```javascript
client.setClientId({ client_id: 'the man from uncle' }, function (reply) {
  console.log(!reply.errmsg);
});
```


#### `client.getClientId(callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-client-id/)

This method gets the client identifier. This method takes no parameters, only a
callback.

```javascript
client.getClientId(function (reply) {
  console.log(reply);
});
```


#### `client.getServerInfo(callback)`
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/server-info/)

This method gets the node name and software version from the server. This method
takes no parameters, only a callback.

```javascript
client.getServerInfo(function (reply) {
  console.log('node:', reply.node);
  console.log('server version:', reply.server_version);
});
```

<a id="connection-methods"></a>
## Connection Methods

#### `client.connect(callback)`

This method connects the client to the server.  The callback function will be
called when the connection is established:

```javascript
client.connect(function () {
  console.log('connected to %s on port %s', client.host, client.port);
});
```

This method has no effect if the client is already connected.


#### `client.disconnect()`

This method disconnects the client from the server.  It takes no parameters and
returns no value.  If the client is not connected, this method has no effect.

```javascript
client.disconnect();
```


<a id="license"></a>
### License

[The MIT License (MIT)](http://opensource.org/licenses/MIT)

Copyright (c) 2013 Nathan LaFreniere

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
