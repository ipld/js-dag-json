/* eslint-env mocha */
import { garbage } from '@ipld/garbage'
import { assert } from 'aegir/chai'
import { bytes, CID } from 'multiformats'
import { base64 } from 'multiformats/bases/base64'
import { encode, decode, stringify, parse } from '../src/index.js'

const same = assert.deepStrictEqual

const recode = (/** @type {Uint8Array} */ byts) => encode(decode(byts))

const link = CID.parse('bafyreifepiu23okq5zuyvyhsoiazv2icw2van3s7ko6d3ixl5jx2yj2yhu')

describe('basic dag-json', () => {
  it('encode decode', () => {
    const byts = encode({ hello: 'world' })
    same(JSON.parse(bytes.toString(recode(byts))), { hello: 'world' })
    const o = { link, byts: bytes.fromString('asdf'), n: null, o: {} }
    const byts2 = encode(o)
    same(decode(byts2), o)
    same(bytes.isBinary(decode(byts2).byts), true)
  })

  it('encode decode 2', () => {
    // mirrors a go-ipld-prime test, but with sorted keys
    const obj = { plain: 'olde string', bytes: utf8Encode('deadbeef') }
    const expected = '{"bytes":{"/":{"bytes":"ZGVhZGJlZWY"}},"plain":"olde string"}'
    const byts = encode(obj)
    same(JSON.parse(bytes.toString(recode(byts))), JSON.parse(expected))
    same(bytes.toString(recode(byts)), expected)
  })

  it('encode decode with ArrayBuffer', () => {
    const byts = encode({ hello: 'world' })
    same(JSON.parse(bytes.toString(recode(byts))), { hello: 'world' })
    const o = { link, byts: bytes.fromString('asdf'), n: null, o: {} }
    const byts2 = encode(o)
    same(decode(byts2), o)
    same(bytes.isBinary(decode(byts2).byts.buffer), true)
  })

  describe('reserved space', () => {
    it('allow alternative types', () => {
      //  wrong types
      for (const obj of [true, false, null, 1, -1, 1.1, { blip: 'bop' }, ['foo']]) {
        same(decode(encode({ '/': obj })), { '/': obj })
        same(decode(encode({ '/': { bytes: obj } })), { '/': { bytes: obj } })
      }
    })

    it('allow specials within reserved space', () => {
      // can we put slash-objects within slashes?
      same(decode(encode({ '/': bytes.fromString('asdf') })), { '/': bytes.fromString('asdf') })
      same(new TextDecoder().decode(encode({ '/': bytes.fromString('asdf') })), '{"/":{"/":{"bytes":"YXNkZg"}}}')
      same(decode(encode({ '/': link })), { '/': link })
      same(new TextDecoder().decode(encode({ '/': link })), '{"/":{"/":"bafyreifepiu23okq5zuyvyhsoiazv2icw2van3s7ko6d3ixl5jx2yj2yhu"}}')
    })

    it('disallow extraneous tokens', () => {
      // encode() shouldn't allow this but it currently does
      // https://github.com/ipld/js-dag-json/issues/91 should change this test
      // into two parts, encode and decode
      assert.throws(() => decode(encode({ '/': link.toString(), x: 'bip' })))
      assert.throws(() => decode(encode({ '/': { bytes: 'mS7ldeA', x: 'bip' } })))
      assert.throws(() => decode(encode({ '/': { bytes: 'mS7ldeA' }, x: 'bip' })))
      assert.throws(() => decode(encode({ '/': { bytes: 'mS7ldeA', x: 'bip' }, bop: 'bip' })))
    })
  })

  it('native types', () => {
    const flip = (/** @type {any} */ obj) => decode(encode(obj))
    same(flip('test'), 'test')
    same(flip(null), null)
    same(flip(12), 12)
    same(flip(-1), -1)
    same(flip(1.2), 1.2)
    same(flip(true), true)
    same(flip(false), false)
    same(flip([]), [])
    same(flip(['asdf']), ['asdf'])
    same(decode(utf8Encode('10.0')), 10)
    same(decode(utf8Encode('[-10.0, 1.0, 0.0, 100.0]')), [-10, 1, 0, 100])
  })

  it('stable map key sorting', () => {
    const s1 = bytes.toString(encode({ a: 1, b: 2, bb: 2.2, c: 3, c_: 3.3 }))
    const s2 = bytes.toString(encode({ c_: 3.3, bb: 2.2, b: 2, c: 3, a: 1 }))
    same('{"a":1,"b":2,"bb":2.2,"c":3,"c_":3.3}', s1)
    same('{"a":1,"b":2,"bb":2.2,"c":3,"c_":3.3}', s2)
  })

  it('bigints', () => {
    const verify = (/** @type {number | bigint} **/ inp) => {
      assert.strictEqual(decode(utf8Encode(String(inp))), inp)
    }

    // plain Number objects
    verify(0)
    verify(1)
    verify(-1)
    verify(Math.pow(2, 50))
    verify(-Math.pow(2, 50))
    verify(Number.MAX_SAFE_INTEGER)
    verify(-Number.MAX_SAFE_INTEGER)
    // should round-trip as BigInts
    verify(BigInt('9007199254740992')) // Number.MAX_SAFE_INTEGER+1
    verify(BigInt('9007199254740993'))
    verify(BigInt('11959030306112471731'))
    verify(BigInt('18446744073709551615')) // max uint64
    verify(BigInt('9223372036854775807')) // max int64
    verify(BigInt('-9007199254740992'))
    verify(BigInt('-9007199254740993'))
    verify(BigInt('-9223372036854776000')) // min int64
    verify(BigInt('-11959030306112471732'))
    verify(BigInt('-18446744073709551616')) // min -uint64
  })

  it('error on circular references', () => {
    const circularObj = {}
    circularObj.a = circularObj
    assert.throws(() => encode(circularObj), /object contains circular references/)
    const circularArr = [circularObj]
    circularObj.a = circularArr
    assert.throws(() => encode(circularArr), /object contains circular references/)
  })

  it('error on encoding undefined', () => {
    assert.throws(() => encode(undefined), /\Wundefined\W.*not supported/)
    const objWithUndefined = { a: 'a', b: undefined }
    assert.throws(() => encode(objWithUndefined), /\Wundefined\W.*not supported/)
  })

  it('error on encoding IEEE 754 specials', () => {
    for (const special of [NaN, Infinity, -Infinity]) {
      assert.throws(() => encode(special), new RegExp(`\\W${String(special)}\\W.*not supported`))
      const objWithSpecial = { a: 'a', b: special }
      assert.throws(() => encode(objWithSpecial), new RegExp(`\\W${String(special)}\\W.*not supported`))
      const arrWithSpecial = [1, 1.1, -1, -1.1, Number.MAX_SAFE_INTEGER, special, Number.MIN_SAFE_INTEGER]
      assert.throws(() => encode(arrWithSpecial), new RegExp(`\\W${String(special)}\\W.*not supported`))
    }
  })

  it('fuzz serialize and deserialize with garbage', function () {
    // filter out fuzz garbage for objects that are disqualified by DAG-JSON rules
    /** @type {(obj: any) => boolean} */
    const checkObj = (obj) => {
      if (Array.isArray(obj)) {
        return obj.every(checkObj)
      }
      if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          if (key === '/') {
            if (typeof value === 'string') {
              return false
            }
            if (value && typeof value === 'object' && value.bytes !== undefined) {
              return false
            }
          }
          if (!checkObj(value)) {
            return false
          }
        }
      }
      return true
    }

    this.timeout(5000)
    for (let ii = 0; ii < 1000; ii++) {
      const original = garbage(300)
      if (!checkObj(original)) {
        continue
      }
      const encoded = encode(original)
      const decoded = decode(encoded)
      same(decoded, original)
    }
  })

  it('serialize', () => {
    same(stringify({ hello: 'world' }), JSON.stringify({ hello: 'world' }))

    const input = { link, bytes: bytes.fromString('asdf'), n: null, o: {} }
    same(stringify(input), JSON.stringify({
      bytes: { '/': { bytes: base64.baseEncode(input.bytes) } },
      link: { '/': link.toString() },
      n: null,
      o: {}
    }))

    const output = parse(stringify(input))
    same(input, output)
    same(bytes.isBinary(output.bytes), true)
    same(CID.asCID(output.link), output.link)
  })

  describe('typed arrays', () => {
    // This mirrors what ships by default in dag-cbor: https://github.com/rvagg/cborg/blob/968fdac4af22c9b22fe5b40c2a6f9bb855780a4a/test/test-2bytes.js#L121
    // It's an open question whether this should slip by without error or not,
    // for now we silently convert them to plain bytes and they all round trip
    // as Uint8Arrays.
    const cases = /** @type {{obj: ArrayBufferView, expected: string}[]} */([
      {
        obj: Uint8Array.from([1, 2, 3]),
        expected: '{"/":{"bytes":"AQID"}}'
      },
      {
        obj: Uint8ClampedArray.from([1, 2, 3]),
        expected: '{"/":{"bytes":"AQID"}}'
      },
      {
        obj: Uint16Array.from([1, 2, 3]),
        expected: '{"/":{"bytes":"AQACAAMA"}}'
      },
      {
        obj: Uint32Array.from([1, 2, 3]),
        expected: '{"/":{"bytes":"AQAAAAIAAAADAAAA"}}'
      },
      {
        obj: Int8Array.from([1, 2, -3]),
        expected: '{"/":{"bytes":"AQL9"}}'
      },
      {
        obj: Int16Array.from([1, 2, -3]),
        expected: '{"/":{"bytes":"AQACAP3/"}}'
      },
      {
        obj: Int32Array.from([1, 2, -3]),
        expected: '{"/":{"bytes":"AQAAAAIAAAD9////"}}'
      },
      {
        obj: Float32Array.from([1, 2, -3]),
        expected: '{"/":{"bytes":"AACAPwAAAEAAAEDA"}}'
      },
      {
        obj: Float64Array.from([1, 2, -3]),
        expected: '{"/":{"bytes":"AAAAAAAA8D8AAAAAAAAAQAAAAAAAAAjA"}}'
      },
      {
        obj: BigUint64Array.from([BigInt(1), BigInt(2), BigInt(3)]),
        expected: '{"/":{"bytes":"AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA"}}'
      },
      {
        obj: BigInt64Array.from([BigInt(1), BigInt(2), BigInt(-3)]),
        expected: '{"/":{"bytes":"AQAAAAAAAAACAAAAAAAAAP3/////////"}}'
      },
      {
        obj: new DataView(Uint8Array.from([1, 2, 3]).buffer),
        expected: '{"/":{"bytes":"AQID"}}'
      },
      {
        obj: Uint8Array.from([1, 2, 3]).buffer,
        expected: '{"/":{"bytes":"AQID"}}'
      }
    ])

    for (const testCase of cases) {
      it(testCase.obj.constructor.name, () => {
        same(utf8Decode(encode(testCase.obj)), testCase.expected)
        const decoded = decode(utf8Encode(testCase.expected))
        assert.instanceOf(decoded, Uint8Array)
        if (testCase.obj instanceof ArrayBuffer) {
          same(decoded, new Uint8Array(testCase.obj))
        } else {
          same(decoded, new Uint8Array(testCase.obj.buffer, testCase.obj.byteOffset, testCase.obj.byteLength))
        }
      })
    }
  })

  it('reject duplicate map keys', () => {
    assert.throws(() => decode(utf8Encode('{"foo":1,"foo":2,"bar":3}')), /found repeat map key "foo"/)
  })
})

/**
 * @param {string} s
 * @returns {Uint8Array}
 */
function utf8Encode (s) {
  return new TextEncoder().encode(s)
}

/**
 * @param {Uint8Array} b
 * @returns {string}
 */
function utf8Decode (b) {
  return new TextDecoder().decode(b)
}
