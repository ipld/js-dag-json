const dj = require('../')
const {test} = require('tap')
const CID = require('cids')
const Block = require('ipfs-block')

const stringLink = 'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'

test('create', async t => {
  let bl = await dj.mkblock({test: 1})
  t.ok(Block.isBlock(bl))
})

test('parse', async t => {
  let bl = await dj.mkblock({test: 1})
  let parsed = dj.from(bl)
  t.same(parsed, {test: 1})
})

test('parse buffer and string', async t => {
  let bl = await dj.mkblock({test: 1})
  let parsed = dj.from(bl)
  t.same(parsed, {test: 1})
  parsed = dj.from(bl.data)
  t.same(parsed, {test: 1})
  parsed = dj.from(bl.data.toString())
  t.same(parsed, {test: 1})
})

test('links', async t => {
  let bl = await dj.mkblock(
    {link: new CID(stringLink)}
  )
  let parsed = dj.from(bl)
  t.ok(CID.isCID(parsed.link))
  t.same(parsed.link.toBaseEncodedString(), stringLink)
  t.same({link: new CID(stringLink)}, parsed)
})

test('arrays', async t => {
  let bl = await dj.mkblock(
    { arr: [1, new CID(stringLink), 3] }
  )
  let parsed = dj.from(bl)
  t.ok(CID.isCID(parsed.arr[1]))
  t.same(parsed.arr[1].toBaseEncodedString(), stringLink)
  t.same({ arr: [1, new CID(stringLink), 3] }, parsed)
})
