import json from 'fast-json-stable-stringify'
// @ts-ignore
import isCircular from '@ipld/is-circular'
import transform from 'lodash.transform'
import { bytes, CID } from 'multiformats'
import { base64 } from 'multiformats/bases/base64'

/**
 * @template {number} Code
 * @template T
 * @typedef {import('multiformats/codecs/interface').BlockCodec<Code, T>} BlockCodec
 */

/**
 * @template T
 * @param {T} obj
 * @returns {T}
 */
const transformEncode = (obj) => transform(obj,
  /**
   * @param {any} result
   * @param {any} value
   * @param {string} key
   */
  (result, value, key) => {
    const cid = CID.asCID(value)
    if (cid) {
      result[key] = { '/': cid.toString() }
    } else if (bytes.isBinary(value)) {
      value = bytes.coerce(value)
      result[key] = { '/': { bytes: base64.encode(value) } }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = transformEncode(value)
    } else {
      result[key] = value
    }
  })

/**
 * @template T
 * @param {T} obj
 * @returns {Uint8Array}
 */
const _encode = (obj) => {
  if (typeof obj === 'object' && !bytes.isBinary(obj) && !CID.asCID(obj) && obj) {
    if (isCircular(obj, { asCID: true })) {
      throw new Error('Object contains circular references')
    }
    obj = transformEncode(obj)
  }
  return bytes.fromString(json(obj))
}

/**
 * @param {object} obj
 * @returns {any}
 */
const transformDecode = (obj) => transform(obj,
  /**
   * @param {any} result
   * @param {any} value
   * @param {string} key
   * @returns {any}
   */
  (result, value, key) => {
    if (typeof value === 'object' && value !== null) {
      if (value['/']) {
        if (typeof value['/'] === 'string') {
          result[key] = CID.parse(value['/'])
        } else if (typeof value['/'] === 'object' && value['/'].bytes) {
          result[key] = base64.decode(value['/'].bytes)
        } else {
          result[key] = transformDecode(value)
        }
      } else {
        result[key] = transformDecode(value)
      }
    } else {
      result[key] = value
    }
  })

/**
 * @template T
 * @param {Uint8Array} data
 * @returns {T}
 */
const _decode = (data) => {
  const obj = JSON.parse(bytes.toString(data))
  return transformDecode({ value: obj }).value
}

/**
 * @template T
 * @type {BlockCodec<0x0129, T>}
 */
export const { name, code, decode, encode } = {
  name: 'dag-json',
  code: 0x0129,
  encode: _encode,
  decode: _decode
}
