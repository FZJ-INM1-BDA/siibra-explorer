const chromeOpts = require('../chromeOpts')
const pptr = require('puppeteer')
const ATLAS_URL = (process.env.ATLAS_URL || 'http://localhost:3000').replace(/\/$/, '')
const USE_SELENIUM = !!process.env.SELENIUM_ADDRESS
if (ATLAS_URL.length === 0) throw new Error(`ATLAS_URL must either be left unset or defined.`)
if (ATLAS_URL[ATLAS_URL.length - 1] === '/') throw new Error(`ATLAS_URL should not trail with a slash: ${ATLAS_URL}`)
const { By, WebDriver } = require('selenium-webdriver')

function getActualUrl(url) {
  return /^http\:\/\//.test(url) ? url : `${ATLAS_URL}/${url.replace(/^\//, '')}`
}

async function getIndexFromArrayOfWebElements(search, webElements) {
  const texts = await Promise.all(
    webElements.map(e => e.getText())
  )
  return texts.findIndex(text => text.indexOf(search) >= 0)
}

class WdBase{
  constructor() {
    browser.waitForAngularEnabled(false)
  }
  get browser(){
    return this.driver || browser
  }
  async init() {

  }

  async initHttpInterceptor(){
    await this.browser.executeScript(() => {
      if (window.__isIntercepting__) return
      window.__isIntercepting__ = true
      const open = window.XMLHttpRequest.prototype.open
      window.__interceptedXhr__ = []
      window.XMLHttpRequest.prototype.open = function () {
        window.__interceptedXhr__.push({
          method: arguments[0],
          url: arguments[1]
        })
        return open.apply(this, arguments)
      }
    })
  }

  async isHttpIntercepting(){
    return await this.browser.executeScript(() => {
      return window.__isIntercepting__
    })
  }

  async getInterceptedHttpCalls(){
    return await this.browser.executeScript(() => {
      return window['__interceptedXhr__']
    })
  }
  async goto(url = '/', { interceptHttp } = {}){
    const actualUrl = getActualUrl(url)
    if (interceptHttp) {
      this.browser.get(actualUrl)
      await this.initHttpInterceptor() 
    } else {
      await this.browser.get(actualUrl)
    }
  }
  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    await this.browser.sleep(ms)
  }
}

class WdLayoutPage extends WdBase{

  constructor(){
    super()
  }

  async findElement(selector){
    return await this.browser.findElement( By.css(selector) )
  }

  async getModal() {
    return await this.browser.findElement( By.tagName('mat-dialog-container') )
  }

  async dismissModal() {
    try {
      const modal = await this.getModal()
      const okBtn = await modal
        .findElement( By.tagName('mat-dialog-actions') )
        .findElement( By.css('button[color="primary"]') )
      await okBtn.click()
    } catch (e) {
      
    }
  }

  async findTitleCards() {
    return await this.browser
      .findElement( By.tagName('ui-splashscreen') )
      .findElements( By.tagName('mat-card') )
  }

  async selectTitleCard( title ) {
    const titleCards = await this.findTitleCards()
    const idx = await getIndexFromArrayOfWebElements(title, titleCards)
    if (idx >= 0) await titleCards[idx].click()
    else throw new Error(`${title} does not fit any titleCards`)
  }

  async getSideNav() {
    return await this.browser.findElement( By.tagName('search-side-nav') )
  }

  async getSideNavTag(){
    return await this.browser
      .findElement( By.css('[mat-drawer-trigger]') )
      .findElement( By.tagName('i') )
  }

  async getStatusPanel(){
    return await this.browser.findElement( By.css('[mat-drawer-status-panel]') )
  }
}

class WdIavPage extends WdLayoutPage{
  constructor(){
    super()
  }

  async selectDropdownTemplate(title) {
    const templateBtn = await (await this.getSideNav())
      .findElement( By.tagName('viewer-state-controller') )
      .findElement( By.css('[aria-label="Select a new template"]') )
    await templateBtn.click()

    const options = await this.browser.findElements(
      By.tagName('mat-option')
    )
    const idx = await getIndexFromArrayOfWebElements(title, options)
    if (idx >= 0) await options[idx].click()
    else throw new Error(`${title} is not found as one of the dropdown templates`)
  }

  async getViewerContainer() {
    return await this.browser.findElement(
      By.id('neuroglancer-container')
    )
  }

  async viewerIsPopulated() {
    const ngContainer = await this.getViewerContainer()
    const canvas = await ngContainer.findElement(
      By.tagName('canvas')
    )
    return !!canvas
  }

  async getNavigationState() {
    const actualNav = await this.browser.executeScript(async () => {
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
    return actualNav
  }

}

class PptrIAVPage{

  constructor(){
    this.browser = null
    this.page = null
  }

  async init() {
    this.browser = browser

    this.page = await this.browser.newPage()
    await this.page.setViewport({
      width: 1600,
      height: 900
    })
  }

  async goto(url = '/') {
    const actualUrl = getActualUrl(url)
    await this.page.goto(actualUrl, { waitUntil: 'networkidle2' })
  }

  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    await this.page.waitFor(ms)
  }
}

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

exports.waitMultiple = process.env.WAIT_ULTIPLE || 1

exports.AtlasPage = WdIavPage
exports.LayoutPage = WdLayoutPage