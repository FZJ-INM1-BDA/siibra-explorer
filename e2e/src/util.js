exports.getSearchParam = page => {
  return page.evaluate(`window.location.search`)
}

exports.wait = (browser) => new Promise(resolve => {

  /**
   * TODO figure out how to wait until the select parcellation is populated
   */
    
  browser.sleep(1000)
    .then(resolve)
})