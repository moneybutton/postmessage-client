require('@babel/register')({
  'presets': ['@babel/preset-env'],
  'plugins': [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties'
  ]
})
