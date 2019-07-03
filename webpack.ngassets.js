module.exports = {
  module : {
    rules : [
      {
        test : /(html|css)$/,
        exclude : /export\_nehuba|index|plugin\_examples|indigo-pink\.css/,
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