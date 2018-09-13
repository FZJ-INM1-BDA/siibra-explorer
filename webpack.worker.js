module.exports = {
  module : {
    rules : [{
      test : /worker.*?\.ts/,
      loaders : ['ts-loader'],
      exclude : /node_modules/
    }],
  }
}