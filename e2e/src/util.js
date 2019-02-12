const {URLSearchParams} = require('url')

exports.getSearchParam = (browser) => {
  const script = `
  const search = window.location.search;
  return search
  `
  return browser.executeScript(script)
    .then(search => new URLSearchParams(search))
}

exports.wait = (browser) => new Promise(resolve => {

  /**
   * TODO figure out how to wait until the select parcellation is populated
   */
    
  browser.sleep(1000)
    .then(resolve)
})