'use strict'
const dag = require('../')
const CID = require('cids')
const { it } = require('mocha')
const assert = require('assert')
const tsame = require('tsame')

const same = (...args) => assert.ok(tsame(...args))
const test = it

const recode = buffer => dag.encode(dag.decode(buffer))

const link = new CID('zdpuAtX7ZibcWdSKQwiDCkPjWwRvtcKCPku9H7LhgA4qJW4Wk')

test('encode decode', async () => {
  let buffer = dag.encode({ hello: 'world' })
  same(JSON.parse(recode(buffer).toString()), { hello: 'world' })
  let o = { link, buffer: Buffer.from('asdf') }
  buffer = dag.encode(o)
  same(dag.decode(buffer), o)
})

test('circular failure', async () => {
  let o1 = { hello: 'world' }
  let o2 = { o1 }
  o1.o2 = o2
  try {
    dag.encode(o2)
    assert.ok(false)
  } catch (e) {
    same(e.message, 'Object contains circular references.')
  }
})
