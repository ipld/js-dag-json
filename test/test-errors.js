const dj = require('../')
const {test} = require('tap')

let a = {}
let b = {}
a.b = b
b.a = a

test('stringify', async t => {
  try {
    dj.stringify({a, b})
  } catch (e) {
    t.same(e.message, 'Object contains circular references.')
  }
})

test('serialize', t => {
  t.plan(1)
  dj.interface.util.serialize({a, b}, err => {
    t.same(err.message, 'Object contains circular references.')
  })
})

test('deserialize', t => {
  t.plan(1)
  dj.interface.util.deserialize(Buffer.from('asdf'), err => {
    t.same(err.message, 'Unexpected token a in JSON at position 0')
  })
})

test('resolve', t => {
  t.plan(1)
  dj.interface.util.serialize({test: 1}, (err, encoded) => {
    if (err) throw err
    dj.interface.resolver.resolve(encoded, 'notfound', err => {
      t.same(err.message, `Key not found "notfound"`)
    })
  })
})
