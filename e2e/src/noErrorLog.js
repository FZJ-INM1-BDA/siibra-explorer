module.exports = (browser) => {
  if (!browser) {
    fail('browser not defined')
    throw new Error('browser not defined')
  }
  browser.manage().logs().get('browser')
    .then(browserLogs => {
      const errorLogs = browserLogs
        .filter(log => !(/favicon/.test(log.message)))
        .filter(log => log.level.value > 900)
      expect(errorLogs.length).toEqual(0)
    })
    .catch(fail)
}