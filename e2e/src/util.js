const chromeOpts = require('../chromeOpts')
const pptr = require('puppeteer')
const ATLAS_URL = (process.env.ATLAS_URL || 'http://localhost:3000').replace(/\/$/, '')
const USE_SELENIUM = !!process.env.SELENIUM_ADDRESS
if (ATLAS_URL.length === 0) throw new Error(`ATLAS_URL must either be left unset or defined.`)
if (ATLAS_URL[ATLAS_URL.length - 1] === '/') throw new Error(`ATLAS_URL should not trail with a slash: ${ATLAS_URL}`)
const { By } = require('selenium-webdriver')

function getActualUrl(url) {
  return /^http\:\/\//.test(url) ? url : `${ATLAS_URL}/${url.replace(/^\//, '')}`
}

async function getIndexFromArrayOfWebElements(search, webElements) {
  const texts = await Promise.all(
    webElements.map(e => e.getText())
  )
  return texts.findIndex(text => text.indexOf(search) >= 0)
}

class WdIavPage{
  constructor(){
    
  }

  async init() {

  }

  async goto(url = '/'){
    const actualUrl = getActualUrl(url)
    await browser.get(actualUrl)
  }

  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    await browser.sleep(ms)
  }

  async getModal() {
    return await browser.findElement( By.tagName('mat-dialog-container') )
  }

  async dismissModal() {
    try {
      const modal = await this.getModal()
      const okBtn = await modal
        .findElement( By.tagName('mat-dialog-actions') )
        .findElement( By.css('button[color="primary"] > span.mat-button-wrapper') )
      await okBtn.click()
    } catch (e) {
      console.log(e)
    }
  }

  async findTitleCards() {
    return await browser
      .findElement( By.tagName('ui-splashscreen') )
      .findElements( By.tagName('mat-card') )
  }

  async selectTitleCard( title ) {
    const titleCards = await this.findTitleCards()
    const idx = await getIndexFromArrayOfWebElements(title, titleCards)
    if (idx >= 0) await titleCards[idx].click()
    else throw new Error(`${title} does not fit any titleCards`)
  }

  async selectDropdownTemplate(title) {
    const templateBtn = await (await this.getSideNav())
      .findElement( By.tagName('viewer-state-controller') )
      .findElement( By.css('[aria-label="Select a new template"]') )
    await templateBtn.click()

    const options = await browser.findElements(
      By.tagName('mat-option')
    )
    const idx = await getIndexFromArrayOfWebElements(title, options)
    if (idx >= 0) await options[idx].click()
    else throw new Error(`${title} is not found as one of the dropdown templates`)
  }

  async screenshotViewer() {
    const ngContainer = await this.getViewerContainer()
    if (!ngContainer) throw new Error(`neuroglancer-container not defined`)
    return await ngContainer.takeScreenshot(false)
  }

  async getViewerContainer() {
    return await browser.findElement(
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

  async getSideNav() {
    return await browser.findElement( By.tagName('search-side-nav') )
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
