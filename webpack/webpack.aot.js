const merge = require('webpack-merge')
const aotCommon = require('./webpack.aot-common')
const inputOutput = require('./webpack.entry-output')
module.exports = merge(inputOutput, aotCommon, {
  mode: 'production',
})
