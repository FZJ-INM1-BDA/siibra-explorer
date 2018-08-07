module.exports = {
  module : {
    rules : [{
      test: /spec\.ts$|test/,
      loaders : ['ts-loader'],
      exclude : /node_modules/
    }]
  },
  resolve:{
    extensions: ['.js','.ts']
  }
}