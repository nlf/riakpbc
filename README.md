# RiakPBC
RiakPBC is a low-level [Riak 2.0](http://basho.com/riak) [protocol buffer](https://developers.google.com/protocol-buffers/docs/overview) client for [node.js](http://nodejs.org/).

[![build status](http://img.shields.io/travis/nlf/riakpbc/master.svg)](http://travis-ci.org/nlf/riakpbc)
[![NPM version](http://img.shields.io/npm/v/riakpbc.svg)](https://www.npmjs.org/package/riakpbc)
[![Code Climate](http://img.shields.io/codeclimate/github/nlf/riakpbc.svg)](https://codeclimate.com/github/nlf/riakpbc)

# Contents
- [Installation](#installation)
- [Usage](#usage)
  - [Client options](#client-options)
- [License](#license)


## Installation

```bash
npm install --save riakpbc
```

## Usage

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
- `nodes`: An array of `{ host, port }` objects specifying all of the Riak nodes to use. These are then load balanced via round-robin.
- `host`/`port`: If only connecting to a single node, you may specify the `host` and `port` properties directly rather than passing an array of `nodes`. (Default `host`: `'127.0.0.1'`, Default `port`: `8087`)
- `auth.user`: Username to authenticate as if using [Riak security](http://docs.basho.com/riak/latest/ops/running/authz/).
- `auth.password`: Password to use for authentication if using [Riak security](http://docs.basho.com/riak/latest/ops/running/authz/).

## License

[The MIT License (MIT)](https://raw.githubusercontent.com/nlf/riakpbc/master/LICENSE)
