## JSON Directed Acrylic Graph for IPLD

You probably don't want to use this library directly and instead
access it through the Block interface.

Usage:

```javascript
const Block = require('@ipld/block')
const CID = require('cids')
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

let encoder = Block.encoder(obj, 'dag-json')
let encoded = await Block.encode() // binary encoded block
let decoded = await Block.decoder(encoded, 'dag-json').decode()
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

This library exposes an interface conforming to [`@ipld/codec-interface`](https://github.com/ipld/js-ipld-codec-interface).
