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
        use : [{
          loader : 'file-loader',
          options : {
            name : '[name].[ext]',
            outputPath : 'res/json'
          }
        }]
      }
    ]
  },
  plugins : [
    new webpack.DefinePlugin({
      PLUGINDEV : process.env.PLUGINDEV ? true : false
    })
  ]
}