# RiakPBC
RiakPBC is a low-level [Riak 1.4](http://basho.com/riak)
[protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) client for
[Node.js](http://nodejs.org/).  RiakPBC implements all of the API methods listed in the
[Basho Riak Documentation](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/).

[![build status](https://secure.travis-ci.org/nlf/riakpbc.png)](http://travis-ci.org/nlf/riakpbc)
[![NPM version](https://badge.fury.io/js/riakpbc.png)](http://badge.fury.io/js/riakpbc)
[![Dependency Status](https://david-dm.org/nlf/riakpbc.png)](https://david-dm.org/nlf/riakpbc)
[![Code Climate](https://codeclimate.com/github/nlf/riakpbc.png)](https://codeclimate.com/github/nlf/riakpbc)


## Contents

- [RiakPBC](#riakpbc)
  - [Contents](#contents)
  - [Install](#install)
  - [Usage](#usage)
  - [API](#api)
  - [Bucket Methods](#bucket-methods)
    - [client.getBuckets(callback)](#clientgetbucketscallback)
    - [client.getBucket(params, callback)](#clientgetbucketparams-callback)
    - [client.setBucket(params, callback)](#clientsetbucketparams-callback)
    - [client.resetBucket(params, callback)](#clientresetbucketparams-callback)
    - [client.getKeys(params, callback)](#clientgetkeysparams-streaming-callback)
  - [Object/Key Methods](#objectkey-methods)
    - [client.get(params, callback)](#clientgetparams-callback)
    - [client.put(params, callback)](#clientputparams-callback)
    - [client.del(params, callback)](#clientdelparams-callback)
    - [client.updateCounter(params, callback)](#clientupdatecounterparams-callback)
    - [client.getCounter(params, callback)](#clientgetcounterparams-callback)
  - [Query Methods](#query-methods)
    - [client.mapred(params, callback)](#clientmapredparams-callback)
    - [client.getIndex(query, callback)](#clientgetindexquery-callback)
    - [client.search(params, callback)](#clientsearchparams-callback)
  - [Server Methods](#server-methods)
    - [client.ping(callback)](#clientpingcallback)
      - [client.setClientId(params, callback)](#clientsetclientidparams-callback)
    - [client.getClientId(callback)](#clientgetclientidcallback)
    - [client.getServerInfo(callback)](#clientgetserverinfocallback)
  - [Connection Methods](#connection-methods)
    - [client.connect(callback)](#clientconnectcallback)
    - [client.disconnect()](#clientdisconnect)
  - [License](#license)


## Install

Installation is easy:
```sh
$ npm install riakpbc --save
```


## Usage
Make sure you've got a working Riak server and then connect to it in your
program like this:

```javascript
var riakpbc = require('riakpbc');
var client = riakpbc.createClient();
```

You can specify host and port if your Riak server isn't local or if it's running
on a different port:

```javascript
var client = riakpbc.createClient({host: 'riak.somewhere-else.com', port: 8086});
```

There is also an ```auto_connect``` option to define if the client should automatically
connect to the Riak server before running any commands. If the ```disconnect``` method
is called, ```auto_connect``` will be automatically set to ```false``` to prevent
future connections and all subsequent client calls will result in an error.

Additionally, you may set the `parse_values` option to false to prevent the default behavior
of attempting to automatically parse content values based on content-type. If the option
is set to `false` buffers will always be returned.

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


## Bucket Methods


### client.getBuckets(callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-buckets/)

This method retrieves a list of buckets available on the server.  You shouldn't
run this in production.  This method takes no parameters, only a callback.

```javascript
client.getBuckets(function (err, reply) {
  var buckets = reply.buckets;
  console.log('we have buckets:', buckets);
});
```

The callback will receive an object with a key `buckets` that has a value of an
array of bucket names, each a string:

```javascript
{ buckets: [ 'chicken', 'ice-cream', 'jelly-beans' ] }
```


### client.getBucket(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-bucket-props/)

This call retrieves the properties of a bucket.  The `params` object should have
only one key, `bucket`, and its value should be the bucket name as a
string. Example:

```javascript
client.getBucket({ bucket: 'test' }, function (err, reply) {
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


### client.setBucket(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-bucket-props/)

This method changes the bucket properties.  Supply the bucket name via `bucket`
and properties via `props`.  Example:

```javascript
client.setBucket({ bucket: 'test', props: { allow_mult: true }}, function (err, reply) {
  if (!err) {
    console.log('bucket allows multiple versions.');
  }
});
```
The callback response will be empty on success.


### client.resetBucket(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/http/reset-bucket-props/)

This method resets the bucket properties to default values.  Supply a bucket
name in the `params`:

```javascript
client.resetBucket({ bucket: 'test' }, function (err, reply) {
  if (!err) {
    console.log('bucket properties restored.');
  }
});
```
The callback response will be empty on success.


### client.getKeys(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/list-keys/)

This method retrieves keys from the specified bucket.  Don't use it in
production.

If you specify a callback, the client retrieves the keys all at once:

```javascript
client.getKeys({ bucket: 'test' }, function (err, reply) {
  var keys = reply.keys;
  keys.forEach(function (key) {
    console.log('key:', key)
  });
});
```

A readable stream is also returned that will emit several data events:

```javascript
client.getKeys({ bucket: 'test' }).on('data', function (err, reply) {
  console.log('batch of keys:', reply.keys);
});
```


## Object/Key Methods

### client.get(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/fetch-object/)

This method fetches an object from Riak.  Example:

```javascript
client.get({ bucket: 'test', key: 'the-ballad-of-john-henry' }, function (err, reply) {
  console.log('found song:', reply.content.value);
});
```

If the object is saved with `content-type: application/json`, then `JSON.parse` will be called as the item is fetched from riak and an actual javascript object will be returned.

### client.put(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/store-object/)

This method sends data to Riak for storage.  Use it like this:

```javascript
var song = { title: 'Jockey Full of Bourbon', writer: 'Tom Waits', performer: 'Joe Bonamassa' }
var content = {
  value: JSON.stringify(song),
  content_type: 'application/json'
}
var request = {
  bucket: 'test',
  key: 'bourbon',
  content: content
}

client.put(request, function (err, reply) {
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


To put with secondary indices, set the `content.indexes` to an array of secondary index key value pairs.

```javascript
var song = { title: 'Jockey Full of Bourbon', writer: 'Tom Waits', performer: 'Joe Bonamassa' }
var genreSecondaryIndex = {
  key: 'genre_bin',
  value: 'rock'
}
var yearSecondaryIndex= {
  key: 'year_int',
  value: 1990
}
var content = {
  value: JSON.stringify(song),
  content_type: 'application/json',
  indexes: [genreSecondaryIndex, yearSecondaryIndex]
}
var request = {
  bucket: 'test',
  key: 'bourbon',
  content: content
}

client.put(request, function (err, reply) {
  if (err) {
    console.error(err)
    return
  }
  console.dir(reply);
});
```


### client.del(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/delete-object/)

This method removes a key from a bucket.  Specify the bucket and the key:

```javascript
client.del({ bucket: 'songs', key: 'thriller' }, function (err, reply) {
  console.log('it was totally overrated.');
});
```


### client.updateCounter(params, callback)
(no reference docs)

This method sets or updates a counter (a nifty type of
[CRDT](http://pagesperso-systeme.lip6.fr/Marc.Shapiro/papers/RR-6956.pdf)).
Make sure you pass in a key `amount` with an integer value; the counter will be
incremented by that value.  You can pass in `returnvalue: true` to fetch the
updated counter.

NB: the bucket containing the key must have the property `allow_mult` set to
`true`.

```javascript
client.updateCounter({ bucket: 'test', key: 'times-i-mispell-definitely', amount: 31415 }, function (err, reply) {
  console.log('how bad is it? this many:', reply.value);
});
```


### client.getCounter(params, callback)
(no reference docs)

This method gets a counter value.  Specify the name of the bucket and key in the
`params` object.  Example:

```javascript
client.getCounter({ bucket: 'test', key: 'times-i-mispell-definitely' }, function (err, reply) {
  console.log('how bad is it? this many:', reply.value);
});
```


## Query Methods

### client.mapred(params, callback)
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
client.mapred({ request: JSON.stringify(request), content_type: 'application/json' }, function (err, reply) {
  console.log('first map reduce reply: %s', reply[0]);
});
```
See the tutorial page
[Loading Data and Running MapReduce](http://docs.basho.com/riak/latest/tutorials/fast-track/Loading-Data-and-Running-MapReduce-Queries/)
and the
[Advanced MapReduce](http://docs.basho.com/riak/latest/dev/advanced/mapreduce/)
doc for more details and examples.


This method synchronously returns a readable stream with the results of the map reduce query. Errors are handled via an `error` event on the readable stream.

```javascript
var readStream = client.mapred({ request: JSON.stringify(request), content_type: 'application/json' });

readStream.on('data', dataHandler);
readStream.on('end', endHandler);
readStream.on('error', errorHandler);

function dataHandler(data) {
  console.dir(data)
}
function endHandler() {
  console.log('map reduce stream ended');
}
function errorHandler(err) {
  console.log('error getting keys in a stream');
  console.dir(err);
}
```

### client.getIndex(query, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/secondary-indexes/)

This method makes a secondary index query on the server.  Supply a bucket, an
index, and a query type:

```javascript
var query = { bucket: 'friends', index: 'name_bin', qtype: 0, key: 'Joe' };
client.getIndex(query, function (err, reply) {
  console.log('found keys:', reply.keys);
});
```

With the `qtype` `0`, you must supply `key`, with `qtype` `1`, you must supply
`range_min` and `range_max` values.

NB: 2i index queries only work when the index exists.  Pass an `indexes` array
as part of your `put` calls to index objects as they're stored:

```javascript
client.put({ bucket: '...', content: { value: '...', indexes: [{ key: 'name_bin', value: user.first_name }] } }, ...) function (...) {
  ...
});
```

This method also returns a readable stream. Errors are handled via an `error` event on the stream.

```javascript
var query = {
  bucket: 'friends',
  index: 'name_bin',
  qtype: 1,
  range_min: '!',
  range_max: '~'
}
var keyStream = client.getIndex(query)

keyStream.on('data', dataHandler)

function dataHandler(reply) {
  console.log('found keys:', reply.keys);
}
function endHandler() {
  console.log('got all keys')
}
function errorHandler(err) {
  console.log('error getting keys in a stream');
  console.dir(err);
}
```

If you want to get both the keys and secondary index values, set `return_terms: true` in the query object

```javascript
var query = {
  bucket: 'friends',
  index: 'name_bin',
  qtype: 1,
  range_min: '!',
  range_max: '~',
  return_terms: true
}
var keyStream = client.getIndex(query)

keyStream.on('data', dataHandler)

function dataHandler(reply) {
  var results = reply.results // results is an array of { key: keyData, value: valueData} objects

  results.forEach(function(item) {
    var key = item.key
    var secondaryIndexValue = item.value
    console.dir(key)
    console.dir(value)
  })
}
function endHandler() {
  console.log('got all keys')
}
function errorHandler(err) {
  console.log('error getting keys in a stream');
  console.dir(err);
}
```

### client.search(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/search/)

This method sends a search request to the server.  Specify the index name with
the `index` key and the query with the `q` key.  Example:

```javascript
client.search({ index: 'test', q: 'name:john' }, function (err, reply) {
  console.log('searched and found:', reply);
});
```


## Server Methods


### client.ping(callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/ping/)

This method can be used to test availability of the server.  This method takes
no parameters, only a callback.

```javascript
client.ping(function (err, reply) {
  if (!err) {
    console.log('pong');
  }
});
```


### client.setClientId(params, callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/set-client-id/)

This method sets the client identifier, which helps the server resolve conflicts
and reduce vector clock bloat.

```javascript
client.setClientId({ client_id: 'the man from uncle' }, function (err, reply) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(!err);
});
```


### client.getClientId(callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/get-client-id/)

This method gets the client identifier. This method takes no parameters, only a
callback.

```javascript
client.getClientId(function (err, reply) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(reply);
});
```


### client.getServerInfo(callback)
[reference](http://docs.basho.com/riak/latest/dev/references/protocol-buffers/server-info/)

This method gets the node name and software version from the server. This method
takes no parameters, only a callback.

```javascript
client.getServerInfo(function (err, reply) {
  if (err) {
    console.error(err);
    return;
  }
  console.log('node:', reply.node);
  console.log('server version:', reply.server_version);
});
```

## Connection Methods

### client.connect(callback)

This method connects the client to the server.  The callback function will be
called when the connection is established:

```javascript
client.connect(function (err) {
  if (err) {
    console.error(err);
    return;
  }
  console.log('connected to %s on port %s', client.host, client.port);
});
```

This method has no effect if the client is already connected.


### client.disconnect()

This method disconnects the client from the server.  It takes no parameters and
returns no value.  If the client is not connected, this method has no effect.
This method also explicitly sets the ```auto_connect``` option to false to prevent
the client reconnecting automatically.

```javascript
client.disconnect();
```


## License

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
