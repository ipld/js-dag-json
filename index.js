const json = require('fast-json-stable-stringify')
const CID = require('cids')
const isCircular = require('is-circular')
const transform = require('lodash.transform')
const Block = require('ipfs-block')
const promisify = require('util').promisify
const multihashes = promisify(require('multihashing-async'))

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

const cid = (binaryBlob, options, cb) => {
  if (!cb) {
    cb = options
    options = {version: 1, hashAlg: 'sha2-256'}
  }

  multihashes(binaryBlob, options, (err, multihash) => {
    if (err) return cb(err)
    cb(null, new CID(options.version, 'dag-json', multihash))
  })
}

const util = {serialize, deserialize, cid}

const resolve = (binaryBlob, path, cb) => {
  path = path.split('/').filter(x => x)
  let obj = parse(binaryBlob)
  while (path.length) {
    let key = path.shift()
    if (typeof obj[key] === 'undefined') {
      return setImmediate(() => cb(new Error(`Key not found "${key}"`)))
    }
    if (CID.isCID(obj[key])) {
      return {value: obj[key], remainderPath: path.join('/')}
    }
    obj = obj[key]
  }
}

const tree = (binaryBlob, options, callback) => {
  let paths = []
  let walk = (obj, _path = []) => {
    for (let [key, value] of Object.entries(obj)) {
      if (CID.isCID(value)) {
        paths.push(_path.concat([key]).join('/'))
      } else if (typeof value === 'object' && value !== null) {
        walk(value, _path.concat([key]))
      } else {
        paths.push(_path.concat([key]))
      }
    }
  }
  let obj = parse(binaryBlob)
  walk(obj)
  return paths.map(p => '/' + p)
}

const resolver = {resolve, tree}

const _interface = {
  util,
  resolver,
  defaultHashAlg: 'sha2-256',
  multicodec: 'dag-json'
}

const mkblock = async (obj, algo = _interface.defaultHashAlg) => {
  let str = stringify(obj)
  let buff = Buffer.from(str)
  let multihash = await multihashes(buff, algo)
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
