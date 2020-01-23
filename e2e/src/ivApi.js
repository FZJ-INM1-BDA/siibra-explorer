exports.getSelectedTemplate = (browser) => new Promise((resolve, reject) => {
  browser.executeAsyncScript('let sub = window.interactiveViewer.metadata.selectedTemplateBSubject.subscribe(obj => arguments[arguments.length - 1](obj));sub.unsubscribe()')
    .then(resolve)
    .catch(reject)
})

exports.getSelectedParcellation = (browser) => new Promise((resolve, reject) => {
  browser.executeAsyncScript('let sub = window.interactiveViewer.metadata.selectedParcellationBSubject.subscribe(obj => arguments[arguments.length - 1](obj));sub.unsubscribe()')
    .then(resolve)
    .catch(reject)
})

exports.getSelectedRegions = async (page) => {
  return await page.evaluate(async () => {
    let region, sub
    const getRegion = () => new Promise(rs => {
      sub = interactiveViewer.metadata.selectedRegionsBSubject.subscribe(rs)
    })

    region = await getRegion()
    sub.unsubscribe()
    return region
  })
}