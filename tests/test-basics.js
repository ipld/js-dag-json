const dj = require('../')
const {test} = require('tap')
const CID = require('cids')
const Block = require('ipfs-block')

test('create', async t => {
  let bl = await dj.mkblock({test: 1})
  t.ok(Block.isBlock(bl))
})

test('parse', async t => {
  let bl = await dj.mkblock({test: 1})
  let parsed = dj.from(bl)
  t.same(parsed, {test: 1})
})