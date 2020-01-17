'use strict'
/* globals it */
const dag = require('../')
const CID = require('cids')
const assert = require('assert')
const tsame = require('tsame')

const same = (...args) => assert.ok(tsame(...args))
const test = it

const recode = buffer => dag.encode(dag.decode(buffer))

const link = new CID('zdpuAtX7ZibcWdSKQwiDCkPjWwRvtcKCPku9H7LhgA4qJW4Wk')

test('encode decode', done => {
  let buffer = dag.encode({ hello: 'world' })
  same(JSON.parse(recode(buffer).toString()), { hello: 'world' })
  const o = { link, buffer: Buffer.from('asdf'), n: null, o: {} }
  buffer = dag.encode(o)
  same(dag.decode(buffer), o)
  same(Buffer.isBuffer(dag.decode(buffer).buffer), true)
  done()
})

test('circular failure', done => {
  const o1 = { hello: 'world' }
  const o2 = { o1 }
  o1.o2 = o2
  try {
    dag.encode(o2)
    assert.ok(false)
  } catch (e) {
    same(e.message, 'Object contains circular references.')
  }
  done()
})

test('use reserved space', done => {
  const decoded = dag.decode(dag.encode({ '/': { type: 'stringName' } }))
  same(decoded['/'].type, 'stringName')
  done()
})
