import babel from 'rollup-plugin-babel'
import commonJS from '@rollup/plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'

import pkg from './package.json'

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    replace(getReplacements()),
    external(),
    babel({
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: {
              node: '10'
            }
          }
        ]
      ],
      plugins: getBabelPlugins(),
      exclude: 'node_modules/**'
    }),
    resolve(),
    commonJS()
  ]
}

function getBabelPlugins (options = {}) {
  const plugins = [
    '@babel/plugin-proposal-object-rest-spread'
  ]
  if (options.includeTransformRuntime) {
    plugins.push('@babel/plugin-transform-runtime')
  }
  return plugins
}

function getReplacements () {
  const replacements = {}
  for (const key in process.env) {
    replacements[`process.env.${key}`] = JSON.stringify(process.env[key])
  }
  return replacements
}
