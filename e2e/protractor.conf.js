
// n.b. to start selenium, run npm run wd -- update && npm run wd -- start
// n.b. you will need to run `npm i --no-save puppeteer`, so that normal download script does not download chrome binary
const pptr = require('puppeteer')
const chromeOpts = require('./chromeOpts')
const SELENIUM_ADDRESS = process.env.SELENIUM_ADDRESS

const PROD_FLAG = process.env.NODE_ENV === 'production'

exports.config = {
  ...(SELENIUM_ADDRESS
    ? { seleniumAddress: SELENIUM_ADDRESS }
    : { directConnect: true } 
  ),
  specs: [
    PROD_FLAG
      ? './src/**/*.prod.e2e-spec.js'
      : './src/**/*.e2e-spec.js'
  ],
  jasmineNodeOpts: {
    defaultTimeoutInterval: 1000 * 60 * 10
  },
  capabilities: { 

    // Use headless chrome
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        ...chromeOpts
      ],
      ...(
        SELENIUM_ADDRESS
          ? {}
          : { binary: pptr.executablePath() }
      )
    }
  }
}