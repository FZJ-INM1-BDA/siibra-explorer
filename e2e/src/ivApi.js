const { retry } = require('../../common/util')
const { waitMultiple } = require('./util')

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

exports.getCurrentNavigationState = page => new Promise(async rs => {
  const rObj = await page.evaluate(async () => {

    let returnObj, sub
    const getPr = () =>  new Promise(rs => {

      sub = nehubaViewer.navigationState.all
        .subscribe(({ orientation, perspectiveOrientation, perspectiveZoom, position, zoom }) => {
          returnObj = {
            orientation: Array.from(orientation),
            perspectiveOrientation: Array.from(perspectiveOrientation),
            perspectiveZoom,
            zoom,
            position: Array.from(position)
          }
          rs()
        })
    })

    await getPr()
    sub.unsubscribe()

    return returnObj
  })
  rs(rObj)
})

exports.awaitNehubaViewer = async (page) => {
  const getNVAvailable = () => new Promise(async (rs, rj) => {
    const result = await page.evaluate(() => {
      return !!window.nehubaViewer
    })
    if (result) return rs()
    else return rj()
  })

  await retry(getNVAvailable, { timeout: 500 * waitMultiple, retries: 10 })
}
