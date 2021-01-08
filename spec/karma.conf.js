// Karma configuration
// Generated on Mon Aug 06 2018 12:37:42 GMT+0200 (CEST)

const merge = require('webpack-merge')
const webpackTest = require('../webpack/webpack.test')
const webpackConfig = require('../webpack/webpack.dev')
const fullWebpack = merge(webpackTest, webpackConfig)

const singleRun = process.env.NODE_ENV === 'test'
const browsers = process.env.NODE_ENV === 'test'
  ? ['ChromeHeadless']
  : ['Chrome']

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      './spec/test.ts',
      {
        pattern: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
        served: true,
        included: true
      },
      {
        pattern: 'node_modules/@angular/material/prebuilt-themes/indigo-pink.css',
        served: true,
        included: true
      },
      {
        pattern: './src/util/worker.js',
        served: true,
        included: false
      },
      {
        pattern: './src/res/css/extra_styles.css',
        served: true,
        included: true
      }
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './spec/test.ts' : ['webpack']
    },

    webpack : fullWebpack,

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    mime : {
      'text/x-typescript' : ['ts']
    }
  })
}
