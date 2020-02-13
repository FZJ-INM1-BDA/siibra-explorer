module.exports = [
  ...(process.env.DISABLE_CHROME_HEADLESS ?  [] : ['--headless']),
  '--no-sandbox',
  '--disable-gpu',
  '--disable-setuid-sandbox',
  "--disable-extensions",
  '--window-size=1600,900'
]