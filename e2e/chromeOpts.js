const { width, height } = require('./opts')

module.exports = [
  ...(process.env.DISABLE_CHROME_HEADLESS ?  [] : ['--headless']),
  '--no-sandbox',
  ...(process.env.ENABLE_GPU ? []: ['--disable-gpu']),
  '--disable-setuid-sandbox',
  "--disable-extensions",
  `--window-size=${width},${height}`,
  '--disable-application-cache'
]