'use strict'
const json = require('fast-json-stable-stringify')
const CID = require('cids')
const isCircular = require('is-circular')
const transform = require('lodash.transform')
const codecInterface = require('@ipld/codec-interface')

const _encode = obj => transform(obj, (result, value, key) => {
  if (CID.isCID(value)) {
    result[key] = { '/': value.toBaseEncodedString() }
  } else if (Buffer.isBuffer(value)) {
    result[key] = { '/': { base64: value.toString('base64') } }
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
  return Buffer.from(json(data))
}

const _decode = obj => transform(obj, (result, value, key) => {
  if (typeof value === 'object' && value !== null) {
    if (value['/']) {
      if (typeof value['/'] === 'string') result[key] = new CID(value['/'])
      else if (typeof value['/'] === 'object' && value['/'].base64) {
        result[key] = Buffer.from(value['/'].base64, 'base64')
      } else result[key] = _decode(value)
    } else {
      result[key] = _decode(value)
    }
  } else {
    result[key] = value
  }
})
const decode = buffer => {
  const obj = JSON.parse(buffer.toString())
  return _decode({ value: obj }).value
}

module.exports = codecInterface.create(encode, decode, 'dag-json')
