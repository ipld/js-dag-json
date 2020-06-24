'use strict'
/* globals describe, it */
import main from '../index.js'
import assert from 'assert'
import multiformats from 'multiformats/basics.js'

multiformats.add(main)

const { CID, multicodec, bytes } = multiformats
const dag = {
  encode: v => multicodec.encode(v, 'dag-json'),
  decode: v => multicodec.decode(v, 'dag-json')
}
const same = assert.deepStrictEqual
const test = it

const recode = buffer => dag.encode(dag.decode(buffer))

const link = new CID('bafyreifepiu23okq5zuyvyhsoiazv2icw2van3s7ko6d3ixl5jx2yj2yhu')

describe('basic dag-json', () => {
  test('encode decode', () => {
    let buffer = dag.encode({ hello: 'world' })
    same(JSON.parse(bytes.toString(recode(buffer))), { hello: 'world' })
    const o = { link, buffer: bytes.fromString('asdf'), n: null, o: {} }
    buffer = dag.encode(o)
    same(dag.decode(buffer), o)
    same(bytes.isBinary(dag.decode(buffer).buffer), true)
  })

  test('circular failure', () => {
    const o1 = { hello: 'world' }
    const o2 = { o1 }
    o1.o2 = o2
    try {
      dag.encode(o2)
      assert.ok(false)
    } catch (e) {
      same(e.message, 'Object contains circular references.')
    }
  })

  test('use reserved space', () => {
    const decoded = dag.decode(dag.encode({ '/': { type: 'stringName' } }))
    same(decoded['/'].type, 'stringName')
  })

  test('native types', done => {
    const flip = obj => dag.decode(dag.encode(obj))
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
