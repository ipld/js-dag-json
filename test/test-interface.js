const dj = require('../')
const {test} = require('tap')
const CID = require('cids')

const stringLink = 'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4'

test('serialize', t => {
  t.plan(1)
  dj.interface.util.serialize({test: 1}, (err, encoded) => {
    if (err) throw err
    t.same(encoded, Buffer.from(dj.stringify({test: 1})))
  })
})

test('deserialize', t => {
  t.plan(1)
  dj.interface.util.serialize({test: 1}, (err, encoded) => {
    if (err) throw err
    dj.interface.util.deserialize(encoded, (err, parsed) => {
      if (err) throw err
      t.same(parsed, {test: 1})
    })
  })
})

/* Test is disabled until the codec is registered */

// test('cid', t => {
//   t.plan(2)
//   dj.interface.util.serialize({test: 1}, (err, encoded) => {
//     if (err) throw err
//     dj.interface.util.cid(encoded, (err, cid) => {
//       if (err) throw err
//       console.error({cid})
//       let str = cid.toBaseEncodedString()
//       dj.mkblock({test: 1}).then(block => {
//         t.same(block.cid, cid)
//         t.same(block.cid.toBaseEncodedString(), str)
//       })
//     })
//   })
// })

test('resolve', t => {
  t.plan(1)
  dj.interface.util.serialize({test: 1}, (err, encoded) => {
    if (err) throw err
    dj.interface.resolver.resolve(encoded, 'test', (err, result) => {
      if (err) throw err
      t.same({ value: 1, remainderPath: '' }, result)
    })
  })
})

test('resolve to link', t => {
  t.plan(1)
  let obj = {link: new CID(stringLink)}
  dj.interface.util.serialize(obj, (err, encoded) => {
    if (err) throw err
    dj.interface.resolver.resolve(encoded, 'link/a/b/c', (err, result) => {
      if (err) throw err
      let expected = {
        value: { '/': 'QmaozNR7DZHQK1ZcU9p7QdrshMvXqWK6gpu5rmrkPdT3L4' },
        remainderPath: 'a/b/c'
      }
      t.same(expected, result)
    })
  })
})

test('tree', t => {
  t.plan(1)
  let obj = {
    link: new CID(stringLink),
    test: 1,
    o: {test: 1, link: new CID(stringLink)},
    arr: [1, new CID(stringLink), 3]
  }
  dj.interface.util.serialize(obj, (err, encoded) => {
    if (err) throw err
    dj.interface.resolver.tree(encoded, (err, result) => {
      if (err) throw err
      let expected = [
        '/arr/0',
        '/arr/1',
        '/arr/2',
        '/link',
        '/o/link',
        '/o/test',
        '/test'
      ]
      t.same(result, expected)
    })
  })
})

test('tree w/ options', t => {
  t.plan(1)
  let obj = {
    link: new CID(stringLink),
    test: 1,
    o: {test: 1, link: new CID(stringLink)},
    arr: [1, new CID(stringLink), 3]
  }
  dj.interface.util.serialize(obj, (err, encoded) => {
    if (err) throw err
    dj.interface.resolver.tree(encoded, {}, (err, result) => {
      if (err) throw err
      let expected = [
        '/arr/0',
        '/arr/1',
        '/arr/2',
        '/link',
        '/o/link',
        '/o/test',
        '/test'
      ]
      t.same(result, expected)
    })
  })
})
