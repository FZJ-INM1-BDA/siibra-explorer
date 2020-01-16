
// n.b. to start selenium, run npm run wd -- update && npm run wd -- start
// n.b. you will need to run `npm i --no-save puppeteer`, so that normal download script does not download chrome binary
const pptr = require('puppeteer')

const SELENIUM_ADDRESS = process.env.SELENIUM_ADDRESS

exports.config = {
  ...(SELENIUM_ADDRESS
    ? { seleniumAddress: SELENIUM_ADDRESS }
    : { directConnect: true } 
  ),
  specs: ['./src/**/*.e2e-spec.js'],
  capabilities: { 

    // Use headless chrome
    browserName: 'chrome',
    chromeOptions: {
      args: [ "--headless", "--disable-gpu", "--window-size=800,600"],
      binary: pptr.executablePath()
    }
  }
}