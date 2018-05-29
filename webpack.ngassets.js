module.exports = {
  module : {
    rules : [
      {
        test : /\.(html|css)$/,
        exclude : /export\_nehuba|index/,
        use : {
          loader : 'file-loader',
          options : {
            name : '[name].[ext]'
          }
        }
      }
    ]
  }
}