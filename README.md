# @ipld/dag-json

[![codecov](https://img.shields.io/codecov/c/github/ipld/js-dag-json.svg?style=flat-square)](https://codecov.io/gh/ipld/js-dag-json)
[![CI](https://img.shields.io/github/actions/workflow/status/ipld/js-dag-json/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipld/js-dag-json/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> JS implementation of DAG-JSON

# Install

```console
$ npm i @ipld/dag-json
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `IpldDagJson` in the global namespace.

```html
<script src="https://unpkg.com/@ipld/dag-json/dist/index.min.js"></script>
```

# Usage

`@ipld/dag-json` is designed to be used within multiformats but can be used separately. `encode()`, `decode()` are available as exports, as are `name` and `code` to match with the corresponding DAG-JSON [multicodec](https://github.com/multiformats/multicodec/).

# API Docs

- <https://ipld.github.io/js-dag-json>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipld/js-dag-json/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipld/js-dag-json/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
