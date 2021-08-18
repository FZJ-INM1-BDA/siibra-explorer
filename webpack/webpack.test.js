module.exports = {
  module : {
    rules : [{
      test: /spec\.ts$/,
      loader : 'ts-loader',
      exclude : /node_modules|third_party/
    }]
  },
  resolve:{
    extensions: ['.js','.ts']
  }
}