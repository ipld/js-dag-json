import path from 'path'

const configs = [{
  input: 'index.js',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs'
  }
}]

const relativeToMain = name => ({
  name: 'relative-to-main',
  renderChunk: source => {
    while (source.includes("require('../index.js')")) {
      source = source.replace("require('../index.js')", `require('${name}')`)
    }
    return source
  }
})

const plugins = [relativeToMain('@ipld/dag-cbor')]
configs.push({
  input: 'test.js',
  output: {
    plugins,
    file: path.join('dist', 'test.cjs'),
    format: 'cjs'
  }
})

export default configs
