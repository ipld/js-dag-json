'use strict'
/* globals describe, it */
import assert from 'assert'
import { encode, decode } from '@ipld/dag-json'
import { bytes, CID } from 'multiformats'

const same = assert.deepStrictEqual
const test = it

const recode = buffer => encode(decode(buffer))

const link = CID.parse('bafyreifepiu23okq5zuyvyhsoiazv2icw2van3s7ko6d3ixl5jx2yj2yhu')

describe('basic dag-json', () => {
  test('encode decode', () => {
    let buffer = encode({ hello: 'world' })
    same(JSON.parse(bytes.toString(recode(buffer))), { hello: 'world' })
    const o = { link, buffer: bytes.fromString('asdf'), n: null, o: {} }
    buffer = encode(o)
    same(decode(buffer), o)
    same(bytes.isBinary(decode(buffer).buffer), true)
  })

  test('circular failure', () => {
    const o1 = { hello: 'world' }
    const o2 = { o1 }
    o1.o2 = o2
    try {
      encode(o2)
      assert.ok(false)
    } catch (e) {
      same(e.message, 'Object contains circular references')
    }
  })

  test('use reserved space', () => {
    const decoded = decode(encode({ '/': { type: 'stringName' } }))
    same(decoded['/'].type, 'stringName')
  })

  test('native types', done => {
    const flip = obj => decode(encode(obj))
    same(flip('test'), 'test')
    same(flip(null), null)
    same(flip(12), 12)
    same(flip(-1), -1)
    same(flip(1.2), 1.2)
    same(flip(true), true)
    same(flip(false), false)
    same(flip([]), [])
    same(flip(['asdf']), ['asdf'])
    done()
  })
})
