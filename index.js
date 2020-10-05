import json from 'fast-json-stable-stringify'
import isCircular from '@ipld/is-circular'
import transform from 'lodash.transform'
import { bytes, CID } from 'multiformats'
import { base64 } from 'multiformats/bases/base64'

const _encode = (obj) => transform(obj, (result, value, key) => {
  const cid = CID.asCID(value)
  if (cid) {
    result[key] = { '/': cid.toString() }
  } else if (bytes.isBinary(value)) {
    value = bytes.coerce(value)
    result[key] = { '/': { bytes: base64.encode(value) } }
  } else if (typeof value === 'object' && value !== null) {
    result[key] = _encode(value)
  } else {
    result[key] = value
  }
})

const encode = (obj) => {
  if (typeof obj === 'object' && !bytes.isBinary(obj) && !CID.asCID(obj) && obj) {
    if (isCircular(obj, { asCID: true })) {
      throw new Error('Object contains circular references')
    }
    obj = _encode(obj)
  }
  return bytes.fromString(json(obj))
}

const _decode = (obj) => transform(obj, (result, value, key) => {
  if (typeof value === 'object' && value !== null) {
    if (value['/']) {
      if (typeof value['/'] === 'string') {
        result[key] = CID.parse(value['/'])
      } else if (typeof value['/'] === 'object' && value['/'].bytes) {
        result[key] = base64.decode(value['/'].bytes)
      } else {
        result[key] = _decode(value)
      }
    } else {
      result[key] = _decode(value)
    }
  } else {
    result[key] = value
  }
})

const decode = (buffer) => {
  const obj = JSON.parse(bytes.toString(buffer))
  return _decode({ value: obj }).value
}

const name = 'dag-json'
const code = 0x0129

export { encode, decode, name, code }
