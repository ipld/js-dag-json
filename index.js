'use strict'
const json = require('fast-json-stable-stringify')
const CID = require('cids')
const isCircular = require('is-circular')
const transform = require('lodash.transform')
const codecInterface = require('@ipld/codec-interface')

let _encode = obj => transform(obj, (result, value, key) => {
  if (CID.isCID(value)) {
    result[key] = { '/': value.toBaseEncodedString() }
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

  let data = _encode(obj)
  return Buffer.from(json(data))
}

let _decode = obj => transform(obj, (result, value, key) => {
  if (typeof value === 'object' && value !== null) {
    if (value['/'] && Object.keys(value).length === 1) {
      result[key] = new CID(value['/'])
    } else {
      result[key] = _decode(value)
    }
  } else {
    result[key] = value
  }
})
const decode = buffer => {
  let obj = JSON.parse(buffer.toString())
  return _decode(obj)
}

module.exports = codecInterface.create(encode, decode, 'dag-json')
