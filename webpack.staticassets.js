module.exports = {
  module : {
    rules : [
      {
        test : /jpg|png/,
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