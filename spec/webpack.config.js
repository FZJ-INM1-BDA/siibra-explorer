// Karma-only webpack partial (merged by @angular-builders/custom-webpack).
//
// The production build uses the esbuild `application` builder, which handles
// `.md` imports via the `loader` option in angular.json. The Karma builder is
// webpack-based and has no equivalent option, so we add a rule here to import
// `.md` files as raw text (webpack 5 `asset/source` -> string default export),
// matching the esbuild `text` loader behaviour.
module.exports = {
  module: {
    rules: [
      {
        test: /\.md$/,
        type: 'asset/source',
      },
    ],
  },
}
