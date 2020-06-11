import json from 'fast-json-stable-stringify'
import isCircular from 'is-circular'
import transform from 'lodash.transform'

export default multiformats => {
  const { CID, bytes, multibase } = multiformats
  const _encode = obj => transform(obj, (result, value, key) => {
    if (CID.isCID(value)) {
      result[key] = { '/': value.toString() }
    } else if (bytes.isBinary(value)) {
      value = bytes.coerce(value)
      result[key] = { '/': { bytes: multibase.encode(value, 'base64') } }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = _encode(value)
    } else {
      result[key] = value
    }
  })

  const encode = obj => {
    if (isCircular(obj)) {
      throw new Error('Object contains circular references.')
    }

    const data = _encode(obj)
    return bytes.fromString(json(data))
  }

  const _decode = obj => transform(obj, (result, value, key) => {
    if (typeof value === 'object' && value !== null) {
      if (value['/']) {
        if (typeof value['/'] === 'string') {
          result[key] = new CID(value['/'])
        } else if (typeof value['/'] === 'object' && value['/'].bytes) {
          result[key] = multibase.decode(value['/'].bytes, 'base64')
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
  const decode = buffer => {
    const obj = JSON.parse(bytes.toString(buffer))
    return _decode({ value: obj }).value
  }
  const name = 'dag-json'
  const code = 0x0129
  return { encode, decode, name, code }
}
