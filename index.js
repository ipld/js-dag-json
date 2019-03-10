const stringify = require('fast-json-stable-stringify')
const CID = require('cids')
const Block = require('ipfs-block')
const promisify = require('util').promisify
const multihashes = require('multihashing-async')

const uint = i => {
  let buff = Buffer.allocUnsafe(4)
  buff.writeUInt32BE(i)
  return buff
}

class Encoder {
  constructor (value) {
    let buffers = []
    let offset = 0
    const traverse = obj => {
      /* Note: this breaks (max-recursion-depth) on
         circular references. Guarding against this
         is a large perf penalty and we'd still just error
      */
      let overlay
      let body
      if (Array.isArray(obj)) {
        overlay = []
        body = []
      } else {
        overlay = {}
        body = {}
      }
      for (let [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
          if (CID.isCID(value)) overlay[key] = value.toBaseEncodedString()
          // TODO: handle all binary types.
          if (Buffer.isBuffer(value)) {
            overlay[key] = [offset, offset + value.length]
            offset += value.length
            buffers.push(value)
          } else {
            let ret = traverse(value)
            overlay[key] = ret.overlay
            body[key] = ret.body
          }
        } else {
          body[key] = value
        }
      }
      return { overlay, body }
    }
    let { overlay, body } = traverse(value)
    this.overlay = overlay
    this.body = body
    this._overlay = Buffer.from(JSON.stringify(overlay))
    this._body = Buffer.from(JSON.stringify(body))
    this._page = [
      uint(this._overlay.length), uint(this._body.length),
      this._overlay, this._body, ...buffers
    ]
    this.data = Buffer.concat(this._page)
  }
}

class Decoder {
  /* The idea here is that someone could write a reader that
   * reads data iteratively, so each property is async
   * and all an iterative data-source needs to implement is a
   * new read method.
   */
  constructor (buffer) {
    this.__buffer = buffer
  }
  async read (start, end) {
    return this.__buffer.slice(start, end)
  }
  get header () {
    return [ this.__buffer.readUInt32BE(0), this.__buffer.readUInt32BE(4) ]
  }
  async overlay () {
    let [ overlayLength ] = this.header
    let buffer = await this.read(8, 8 + overlayLength)
    return JSON.parse(buffer.toString())
  }
  async body () {
    let [ overlayLength, bodyLength ] = this.header
    let start = 8 + overlayLength
    let buffer = await this.read(start, start + bodyLength)
    return JSON.parse(buffer.toString())
  }
  async decode () {
    let buffersOffset = this.header.reduce((x,y) => x + y) + 8
    let overlay = await this.overlay()
    let body = await this.body()
    let traverse = async obj => {
      for (let [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') body[key] = new CID(value)
        else if (Array.isArray(value)) {
          let [ start, end ] = value
          body[key] = await this.read(start + buffersOffset, end + buffersOffset)
        } else if (value && typeof value === 'object') {
          let _body = body
          body = body[key]
          await traverse(value)
          body = _body
        } else {
          throw new Error(`Unkown type in overlay: ${typeof value}`)
        }
      }
    }
    await traverse(body)
    return body
  }
}

const phash = promisify(multihashes)
const encode = obj => (new Encoder(obj)).data
const decode = buffer => (new Decoder(buffer)).decode()

const mkblock = async (obj, algo='sha2-256') => {
  let data = encode(obj)
  let multihash = await phash(data, algo)
  let cid = new CID(1, 'dag-json', multihash)
  return new Block(data, cid)
}
const from = input => {
  if (Block.isBlock(input)) {
    input = input.data
  }
  return decode(input)
}

module.exports = {
  mkblock, 
  from,
  encode,
  decode
}

