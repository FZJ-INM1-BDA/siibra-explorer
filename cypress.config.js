const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    defaultCommandTimeout: 10000,
    supportFile: false,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    SCREENSHOT_URL: process.env.SCREENSHOT_URL,
    SCREENSHOT_PATH: process.env.SCREENSHOT_PATH,
  },
  experimentalWebKitSupport: !!process.env.USE_SAFARI
});
