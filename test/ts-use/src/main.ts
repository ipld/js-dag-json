/* eslint-disable no-console */

import { deepStrictEqual } from 'assert'
import * as dagJson from '@ipld/dag-json'
import { BlockEncoder, BlockDecoder, BlockCodec } from 'multiformats/codecs/interface'

const main = (): void => {
  // make sure we have a full CodecFeature
  useCodecFeature(dagJson)
}

function useCodecFeature (codec: BlockCodec<297, any>): void {
  // use only as a BlockEncoder
  useEncoder(codec)

  // use only as a BlockDecoder
  useDecoder(codec)

  // use with ArrayBuffer input type
  useDecoderWithArrayBuffer(codec)

  // use as a full BlockCodec which does both BlockEncoder & BlockDecoder
  useBlockCodec(codec)
}

function useEncoder<Codec extends number> (encoder: BlockEncoder<Codec, string>): void {
  deepStrictEqual(encoder.code, 297)
  deepStrictEqual(encoder.name, 'dag-json')
  deepStrictEqual(Array.from(encoder.encode('blip')), [34, 98, 108, 105, 112, 34])
  console.log('[TS] ✓ { encoder: BlockEncoder }')
}

function useDecoder<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>): void {
  deepStrictEqual(decoder.code, 297)
  deepStrictEqual(decoder.decode(Uint8Array.from([34, 98, 108, 105, 112, 34])), 'blip')
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useDecoderWithArrayBuffer<Codec extends number> (decoder: BlockDecoder<Codec, Uint8Array>): void {
  deepStrictEqual(decoder.code, 297)
  deepStrictEqual(decoder.decode(Uint8Array.from([34, 98, 108, 105, 112, 34]).buffer), 'blip')
  console.log('[TS] ✓ { decoder: BlockDecoder }')
}

function useBlockCodec<Codec extends number> (blockCodec: BlockCodec<Codec, string>): void {
  deepStrictEqual(blockCodec.code, 297)
  deepStrictEqual(blockCodec.name, 'dag-json')
  deepStrictEqual(Array.from(blockCodec.encode('blip')), [34, 98, 108, 105, 112, 34])
  deepStrictEqual(blockCodec.decode(Uint8Array.from([34, 98, 108, 105, 112, 34])), 'blip')
  console.log('[TS] ✓ {}:BlockCodec')
}

main()

export default main
