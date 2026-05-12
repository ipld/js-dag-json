# @ipld/dag-json <!-- omit in toc -->

[![codecov](https://img.shields.io/codecov/c/github/ipld/js-dag-json.svg?style=flat-square)](https://codecov.io/gh/ipld/js-dag-json)
[![CI](https://img.shields.io/github/actions/workflow/status/ipld/js-dag-json/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipld/js-dag-json/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> JS implementation of DAG-JSON

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
  - [Example](#example)
- [Usage](#usage)
- [License](#license)
- [Contribution](#contribution)

# Install

```console
$ npm i @ipld/dag-json
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `IpldDagJson` in the global namespace.

```html
<script src="https://unpkg.com/@ipld/dag-json/dist/index.min.js"></script>
```

## Example

```javascript
import { encode, decode } from '@ipld/dag-json'
import { CID } from 'multiformats'

const obj = {
  x: 1,
  /* CID instances are encoded as links */
  y: [2, 3, CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4')],
  z: {
    a: CID.parse('QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'),
    b: null,
    c: 'string'
  }
}

let data = encode(obj)
let decoded = decode(data)
decoded.y[0] // 2
CID.asCID(decoded.z.a) // cid instance
```

# Usage

`@ipld/dag-json` is designed to be used within multiformats but can be used separately. `encode()`, `decode()` are available as exports, as are `name` and `code` to match with the corresponding DAG-JSON [multicodec](https://github.com/multiformats/multicodec/).

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipld/js-dag-json/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipld/js-dag-json/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
