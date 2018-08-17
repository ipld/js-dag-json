const json = require('fast-json-stable-stringify')
const CID = require('cids')
const isCircular = require('is-circular')
const transform = require('lodash.transform')
const Block = require('ipfs-block')
const promisify = require('util').promisify
const multihashes = require('multihashing-async')

/* Replace CID instances with encoded objects */
const encode = obj => {
  return transform(obj, (result, value, key) => {
    if (CID.isCID(value)) {
      result[key] = {'/': value.toBaseEncodedString()}
    } else if (typeof value === 'object' && value !== null) {
      result[key] = encode(value)
    } else {
      result[key] = value
    }
  })
}

/* Replace encoded objects with CID instances */
const decode = obj => {
  return transform(obj, (result, value, key) => {
    if (typeof value === 'object' && value !== null) {
      if (value['/'] && Object.keys(value).length === 1) {
        result[key] = new CID(value['/'])
      } else {
        result[key] = decode(value)
      }
    } else {
      result[key] = value
    }
  })
}

/* Parse a buffer or string into a decoded dag node */
const parse = input => {
  if (Buffer.isBuffer(input)) {
    input = input.toString()
  }
  input = JSON.parse(input)
  return decode(input)
}

/* Encode an object into a string encoded dag node */
const stringify = obj => {
  if (isCircular(obj)) {
    throw new Error('Object contains circular references.')
  }
  return json(encode(obj))
}

const serialize = (node, cb) => {
  let encoded
  try {
    encoded = Buffer.from(stringify(node))
  } catch (e) {
    return setImmediate(() => cb(e))
  }
  setImmediate(() => cb(null, encoded))
}

const deserialize = (binaryBlob, cb) => {
  let decoded
  try {
    decoded = parse(binaryBlob)
  } catch (e) {
    return setImmediate(() => cb(e))
  }
  setImmediate(() => cb(null, decoded))
}

/* temporarily disabled while we wait on a registered codec
  https://github.com/multiformats/multicodec/issues/80
*/
/* istanbul ignore next */
const cid = (binaryBlob, options, cb) => {
  if (!cb) {
    cb = options
    options = {version: 1, hashAlg: _interface.defaultHashAlg}
  }
  multihashes(binaryBlob, options.hashAlg, (err, multihash) => {
    if (err) return cb(err)
    cb(null, new CID(options.version, 'dag-json', multihash))
  })
}

const util = {serialize, deserialize, cid}

const resolve = (binaryBlob, path, cb) => {
  path = path.split('/').filter(x => x)
  let obj = parse(binaryBlob)
  let ret = (err, res) => setImmediate(() => cb(err, res))
  while (path.length) {
    let key = path.shift()
    if (typeof obj[key] === 'undefined') {
      return ret(new Error(`Key not found "${key}"`))
    }
    if (CID.isCID(obj[key])) {
      let value = {'/': obj[key].toBaseEncodedString()}
      return ret(null, {value, remainderPath: path.join('/')})
    }
    obj = obj[key]
  }
  ret(null, {value: obj, remainderPath: path.join('/')})
}

const tree = (binaryBlob, options, cb) => {
  if (!cb) {
    cb = options
    options = {}
  }
  let paths = []
  let walk = (obj, _path = []) => {
    for (let [key, value] of Object.entries(obj)) {
      if (CID.isCID(value)) {
        paths.push(_path.concat([key]).join('/'))
      } else if (typeof value === 'object' && value !== null) {
        walk(value, _path.concat([key]))
      } else {
        paths.push(_path.concat([key]).join('/'))
      }
    }
  }
  let obj = parse(binaryBlob)
  walk(obj)
  return setImmediate(() => cb(null, paths.map(p => '/' + p)))
}

const resolver = {resolve, tree}

const _interface = {
  util,
  resolver,
  defaultHashAlg: 'sha2-256',
  multicodec: 'dag-json'
}

const phash = promisify(multihashes)

const mkblock = async (obj, algo = _interface.defaultHashAlg) => {
  let str = stringify(obj)
  let buff = Buffer.from(str)
  let multihash = await phash(buff, algo)
  let cid = new CID(1, 'dag-json', multihash)
  return new Block(buff, cid)
}
const from = input => {
  if (Block.isBlock(input)) {
    input = input.data
  }
  return parse(input)
}

module.exports = {parse, stringify, mkblock, from, interface: _interface}
