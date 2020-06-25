
// n.b. to start selenium, run npm run wd -- update && npm run wd -- start
// n.b. you will need to run `npm i --no-save puppeteer`, so that normal download script does not download chrome binary
const chromeOpts = require('./chromeOpts')
const SELENIUM_ADDRESS = process.env.SELENIUM_ADDRESS

const bsTestname = process.env.BROWSERSTACK_TEST_NAME
const bsUsername = process.env.BROWSERSTACK_USERNAME
const bsAccessKey = process.env.BROWSERSTACK_ACCESS_KEY
const directConnect = !!process.env.DIRECT_CONNECT

const PROTRACTOR_SPECS = process.env.PROTRACTOR_SPECS

const localConfig = bsUsername && bsUsername
  ? {}
  : {
  ...(SELENIUM_ADDRESS
    ? { seleniumAddress: SELENIUM_ADDRESS }
    : { directConnect: true } 
  ),
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
          : { binary: (() => require('puppeteer').executablePath())() }
      )
    }
  }
}


const { Local } = require('browserstack-local');

let bsLocal
/**
 * config adapted from
 * https://github.com/browserstack/protractor-browserstack
 * 
 * MIT licensed
 */
const bsConfig = {
  'browserstackUser': bsUsername,
  'browserstackKey': bsAccessKey,
  
  'capabilities': {
    'build': 'protractor-browserstack',
    'name': bsTestname || 'iav_e2e',
    "os" : "Windows",
    "osVersion" : "10",
    'browserName': 'chrome',
    'browserstack.local': true,
    "seleniumVersion" : "4.0.0-alpha-2",
    'browserstack.debug': 'true'
  },
  "browserName" : "Chrome",
  "browserVersion" : "83.0",

  // Code to start browserstack local before start of test
  beforeLaunch: function(){
    console.log("Connecting local");
    return new Promise(function(resolve, reject){
      bsLocal = new Local();
      bsLocal.start({'key': bsAccessKey }, function(error) {
        if (error) return reject(error);
        console.log('Connected. Now testing...');

        resolve();
      });
    });
  },

  // Code to stop browserstack local after end of test
  afterLaunch: function(){
    return new Promise(function(resolve, reject){
      if (bsLocal) bsLocal.stop(resolve)
      else resolve()
    });
  }
}

exports.config = {
  specs: [
    (PROTRACTOR_SPECS && PROTRACTOR_SPECS) || './src/**/*.prod.e2e-spec.js'
  ],
  jasmineNodeOpts: {
    defaultTimeoutInterval: 1000 * 60 * 10
  },
  
  ...(
    bsAccessKey && bsUsername
    ? bsConfig
    : localConfig
  ),

  ...(
    (directConnect && { directConnect }) || {}
  )
}