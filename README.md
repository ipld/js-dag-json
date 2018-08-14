## JSON Directed Acrylic Graph for IPLD

[![Greenkeeper badge](https://badges.greenkeeper.io/mikeal/dag-json.svg)](https://greenkeeper.io/)

Usage:

```javascript
const dj = require('dag-json')
const obj = {
  x: 1,
  /* CID instances are encoded as links */
  y: [2, 3, new CID('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
  z: {
    a: new CID('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
    b: null,
    c: 'string'
  }
}

let block = await dj.mkblock(obj)
block.cid // instance of CID
block.data // Buffer, node contents

let decoded = dj.from(block)
decoded.y[0] // 2
CID.isCID(decoded.z.a) // true
```

# Spec

The `dag-json` spec is quite simple.

Nodes are in standard JSON format with the following requirements:

* Objects are consistent and deterministic
  * Object keys are sorted (TODO: specify sorting algorithm).
  * No whitespace outside of values. `{"x":1,"y":[2,3]}`
* Links are encoded as objects with a single `'/'` value of the
  base58 encoded CID.
  * `{"/": "QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4"}`

That's all :)

# API

## Recommended API

This implementation of `dag-json` for IPLD includes several low level
methods for encoding/decoding nodes as well as a full interface suitable for
IPFS.

However, the recommended API is only 2 methods: `from` and `mkblock`.

### `dj.mkblock(Object[, algorithm='sha2-256']`

Async function that takes a JavaScript object and returns a Block instance.
Note than all CID instances will be encoded as links.

```javascript
let block = await dj.mkblock({foo: 'bar'})
```

### `dj.from(Block||Buffer||string)`

Takes a Block, Buffer, or string encoded `dag-json` node and return the
decoded node. Note that all links will be `CID` instances.

```javascript
let block = await dj.mkblock({foo: 'bar'})
let obj = dj.from(block)
obj.foo // 'bar'
```

## IPLD/IPFS Standard Interface

The full implementation is at `dj.interface`. It includes:

* API
  * IPLD format utils
    * [dj.interface.util.serialize(dagNode, callback)](https://github.com/ipld/interface-ipld-format#utilserializedagnode-callback)
    * [dj.interface.util.deserialize(binaryBlob, callback)](https://github.com/ipld/interface-ipld-format#utildeserializebinaryblob-callback)
    * [dj.interface.util.cid(binaryBlob[, options], callback)](https://github.com/ipld/interface-ipld-format#utilcidbinaryblob-options-callback)
  * Local resolver methods
    * [dj.interface.resolver.resolve(binaryBlob, path, callback)](https://github.com/ipld/interface-ipld-format#resolverresolvebinaryblob-path-callback)
    * [dj.interface.resolver.tree(binaryBlob[, options], callback)](https://github.com/ipld/interface-ipld-format#resolvertreebinaryblob-options-callback)
  * Properties
    * [dj.interface.defaultHashAlg](https://github.com/ipld/interface-ipld-format#defaulthashalg)
    * [dj.interface.multicodec](https://github.com/ipld/interface-ipld-format#multicodec)

## Additional APIs

### `dj.parse(Buffer||string)`

Takes a Buffer, or string encoded `dag-json` node and return the
decoded node. Note that all links will be `CID` instances.

### `dj.stringify(Object)`

Async function that takes a JavaScript object and returns a string. Note
than all CID instances will be encoded as links.