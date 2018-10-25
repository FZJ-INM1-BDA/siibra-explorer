const webpack = require('webpack')

module.exports = {
  module : {
    rules : [
      {
        test : /jpg|png/,
        exclude : /export\_nehuba|index/,
        use : {
          loader : 'file-loader',
          options : {
            name : 'res/image/[name].[ext]'
          }
        }
      },
      {
        type : 'javascript/auto',
        test : /ext.*?\.json/,
        exclude : /plugin_examples/,
        use : [{
          loader : 'file-loader',
          options : {
            name : '[name].[ext]',
            outputPath : 'res/json'
          }
        }]
      },
      {
        type : 'javascript/auto',
        test : /plugin_examples/,
        use : [{
          loader : 'file-loader',
          options : {
            name : '[path][name].[ext]',
            outputPath : 'res',
            context : 'src'
          }
        }]
      }
    ]
  },
  plugins : [
    new webpack.DefinePlugin({
      PLUGINDEV : process.env.PLUGINDEV
        ? JSON.stringify(process.env.PLUGINDEV)
        : false,
      BUNDLEDPLUGINS : process.env.BUNDLEDPLUGINS
        ? JSON.stringify(process.env.BUNDLEDPLUGINS.split(','))
        : JSON.stringify([]),
      VERSION : process.env.VERSION 
        ? JSON.stringify(process.env.VERSION) 
        : process.env.GIT_HASH
          ? JSON.stringify(process.env.GIT_HASH)
          : JSON.stringify('unspecificied hash')
    })
    // ...ignoreArr.map(dirname => new webpack.IgnorePlugin(/\.\/plugin_examples/))
  ]
}