module.exports = {
  module : {
    rules : [
      {
        test : /(html|css)$/,
        exclude : /export\_nehuba|index/,
        use : {
          loader : 'file-loader',
          options : {
            name : '[name].[ext]'
          }
        }
      },{
        test : /(jpg|png)$/,
        use : {
          loader : 'file-loader',
          options : {
            name : 'res/image/[name].[ext]'
          }
        }
      }
    ]
  }
}