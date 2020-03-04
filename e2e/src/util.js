const chromeOpts = require('../chromeOpts')
const pptr = require('puppeteer')
const ATLAS_URL = (process.env.ATLAS_URL || 'http://localhost:3000').replace(/\/$/, '')
const USE_SELENIUM = !!process.env.SELENIUM_ADDRESS
if (ATLAS_URL.length === 0) throw new Error(`ATLAS_URL must either be left unset or defined.`)
if (ATLAS_URL[ATLAS_URL.length - 1] === '/') throw new Error(`ATLAS_URL should not trail with a slash: ${ATLAS_URL}`)
const { By, WebDriver, Key } = require('selenium-webdriver')

function getActualUrl(url) {
  return /^http\:\/\//.test(url) ? url : `${ATLAS_URL}/${url.replace(/^\//, '')}`
}

async function getIndexFromArrayOfWebElements(search, webElements) {
  const texts = await Promise.all(
    webElements.map(e => e.getText())
  )
  return texts.findIndex(text => text.indexOf(search) >= 0)
}

const regionSearchAriaLabelText = 'Search for any region of interest in the atlas selected'

class WdBase{
  constructor() {
    browser.waitForAngularEnabled(false)
  }
  get browser(){
    return browser
  }
  get driver(){
    return this.browser.driver
  }
  async init() {
    const wSizeArg = chromeOpts.find(arg => arg.indexOf('--window-size') >= 0)
    const [ _, width, height ] = /\=([0-9]{1,})\,([0-9]{1,})$/.exec(wSizeArg)

    const newDim = await this.browser.executeScript(async () => {
      return [
        window.outerWidth - window.innerWidth + (+ arguments[0]),
        window.outerHeight - window.innerHeight + (+ arguments[1]),
      ]
    }, width, height)

    await this.browser.manage()
      .window()
      .setRect({
        width: newDim[0],
        height: newDim[1]
      })
  }

  async cursorMoveTo({ position }) {
    if (!position) throw new Error(`cursorGoto: position must be defined!`)
    const x = Array.isArray(position) ? position[0] : position.x
    const y = Array.isArray(position)? position[1] : position.y
    if (!x) throw new Error(`cursorGoto: position.x or position[0] must be defined`)
    if (!y) throw new Error(`cursorGoto: position.y or position[1] must be defined`)

    return this.driver.actions()
      .move()
      .move({
        x,
        y,
        duration: 1000
      })
      .perform()
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

  // it seems if you set intercept http to be true, you might also want ot set do not automat to be true
  async goto(url = '/', { interceptHttp, doNotAutomate } = {}){
    const actualUrl = getActualUrl(url)
    if (interceptHttp) {
      this.browser.get(actualUrl)
      await this.initHttpInterceptor() 
    } else {
      await this.browser.get(actualUrl)
    }

    if (!doNotAutomate) {
      await this.wait(200)
      await this.dismissModal()
      await this.wait(200)
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

  async findTitleCard(title) {
    const titleCards = await this.findTitleCards()
    const idx = await getIndexFromArrayOfWebElements(title, titleCards)
    if (idx >= 0) return titleCards[idx]
    else throw new Error(`${title} does not fit any titleCards`)
  }

  async selectTitleCard( title ) {
    const titleCard = await this.findTitleCard(title)
    await titleCard.click()
  }

  async selectTitleTemplateParcellation(templateName, parcellationName){
    const titleCard = await this.findTitleCard(templateName)
    const parcellations = await titleCard
      .findElement( By.css('mat-card-content.available-parcellations-container') )
      .findElements( By.tagName('button') )
    const idx = await getIndexFromArrayOfWebElements( parcellationName, parcellations )
    if (idx >= 0) await parcellations[idx].click()
    else throw new Error(`parcellationName ${parcellationName} does not exist`)
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

  async clearAllSelectedRegions() {
    const clearAllRegionBtn = await this.browser.findElement(
      By.css('[aria-label="Clear all regions"]')
    )
    await clearAllRegionBtn.click()
    await this.wait(500)
  }

  async waitUntilAllChunksLoaded(){
    const checkReady = async () => {
      const el = await this.browser.findElements(
        By.css('div.loadingIndicator')
      )
      return !el.length
    }

    do {
      // Do nothing, until ready
    } while (
      await this.wait(1000),
      !(await checkReady())
    )
  }

  async getFloatingCtxInfoAsText(){
    const floatingContainer = await this.browser.findElement(
      By.css('div[floatingMouseContextualContainerDirective]')
    )

    const text = await floatingContainer.getText()
    return text
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

  async getSearchRegionInput(){
    return await (await this.getSideNav())
      .findElement( By.css(`[aria-label="${regionSearchAriaLabelText}"]`) )
  }

  async searchRegionWithText(text=''){
    const searchRegionInput = await this.getSearchRegionInput()
    await searchRegionInput
      .sendKeys(
        Key.chord(Key.CONTROL, 'a'),
        text
      )
  }

  async clearSearchRegionWithText() {
    const searchRegionInput = await this.getSearchRegionInput()
    await searchRegionInput
      .sendKeys(
        Key.chord(Key.CONTROL, 'a'),
        Key.BACK_SPACE,
        Key.ESCAPE
      )
  }

  async getSearchRegionInputAutoCompleteOptions(){
  }

  async selectSearchRegionAutocompleteWithText(text = ''){

    const input = await this.getSearchRegionInput()
    const autocompleteId = await input.getAttribute('aria-owns')
    const options = await this.browser
      .findElement( By.id( autocompleteId ) )
      .findElements( By.tagName('mat-option') )

    const idx = await getIndexFromArrayOfWebElements(text, options)
    if (idx >= 0) {
      await options[idx].click()
    } else {
      throw new Error(`getIndexFromArrayOfWebElements ${text} option not founds`)
    }
  }

  async getVisibleDatasets() {
    const singleDatasetListView = await this.browser
      .findElement( By.tagName('data-browser') )
      .findElement( By.css('div.cdk-virtual-scroll-content-wrapper') )
      .findElements( By.tagName('single-dataset-list-view') )

    const returnArr = []
    for (const item of singleDatasetListView) {
      returnArr.push( await item.getText() )
    }
    return returnArr
  }

  async viewerIsPopulated() {
    const ngContainer = await this.browser.findElement(
      By.id('neuroglancer-container')
    )
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