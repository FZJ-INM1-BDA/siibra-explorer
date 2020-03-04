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

function _getTextFromWebElement(webElement) {
  return webElement.getText()
}

async function _getIndexFromArrayOfWebElements(search, webElements) {
  const texts = await Promise.all(
    webElements.map(_getTextFromWebElement)
  )
  return texts.findIndex(text => text.indexOf(search) >= 0)
}

const regionSearchAriaLabelText = 'Search for any region of interest in the atlas selected'

class WdBase{
  constructor() {
    browser.waitForAngularEnabled(false)
  }
  get _browser(){
    return browser
  }
  get _driver(){
    return this._browser.driver
  }
  async init() {
    const wSizeArg = chromeOpts.find(arg => arg.indexOf('--window-size') >= 0)
    const [ _, width, height ] = /\=([0-9]{1,})\,([0-9]{1,})$/.exec(wSizeArg)

    const newDim = await this._browser.executeScript(async () => {
      return [
        window.outerWidth - window.innerWidth + (+ arguments[0]),
        window.outerHeight - window.innerHeight + (+ arguments[1]),
      ]
    }, width, height)

    await this._browser.manage()
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

    return this._driver.actions()
      .move()
      .move({
        x,
        y,
        duration: 1000
      })
      .perform()
  }

  async initHttpInterceptor(){
    await this._browser.executeScript(() => {
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
    return await this._browser.executeScript(() => {
      return window.__isIntercepting__
    })
  }

  async getInterceptedHttpCalls(){
    return await this._browser.executeScript(() => {
      return window['__interceptedXhr__']
    })
  }
  async goto(url = '/', { interceptHttp, doNotAutomate } = {}){
    const actualUrl = getActualUrl(url)
    if (interceptHttp) {
      this._browser.get(actualUrl)
      await this.initHttpInterceptor() 
    } else {
      await this._browser.get(actualUrl)
    }

    if (!doNotAutomate) {
      await this.wait(200)
      await this.dismissModal()
      await this.wait(200)
    }
  }

  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    await this._browser.sleep(ms)
  }
}

class WdLayoutPage extends WdBase{

  constructor(){
    super()
  }

  async dismissModal() {
    try {
      const okBtn = await this._browser
        .findElement( By.tagName('mat-dialog-container') )
        .findElement( By.tagName('mat-dialog-actions') )
        .findElement( By.css('button[color="primary"]') )
      await okBtn.click()
    } catch (e) {
      
    }
  }

  async _findTitleCard(title) {
    const titleCards = await this._browser
      .findElement( By.tagName('ui-splashscreen') )
      .findElements( By.tagName('mat-card') )
    const idx = await _getIndexFromArrayOfWebElements(title, titleCards)
    if (idx >= 0) return titleCards[idx]
    else throw new Error(`${title} does not fit any titleCards`)
  }

  async selectTitleCard( title ) {
    const titleCard = await this._findTitleCard(title)
    await titleCard.click()
  }

  async selectTitleTemplateParcellation(templateName, parcellationName){
    const titleCard = await this._findTitleCard(templateName)
    const parcellations = await titleCard
      .findElement( By.css('mat-card-content.available-parcellations-container') )
      .findElements( By.tagName('button') )
    const idx = await _getIndexFromArrayOfWebElements( parcellationName, parcellations )
    if (idx >= 0) await parcellations[idx].click()
    else throw new Error(`parcellationName ${parcellationName} does not exist`)
  }


  // SideNav
  _getSideNav() {
    return this._browser.findElement( By.tagName('search-side-nav') )
  }

  async getSideNavTag(){
    return await this._browser
      .findElement( By.css('[mat-drawer-trigger]') )
      .findElement( By.tagName('i') )
  }

  sideNavIsVisible(){
    return this._getSideNav().isDisplayed()
  }

  // SideNavTag
  _getSideNavTab(){
    return this._browser
      .findElement( By.css('[mat-drawer-trigger]') )
      .findElement( By.tagName('i') )
  }

  sideNavTabIsVisible(){
    return this._getSideNavTab().isDisplayed()
  }

  clickSideNavTab(){
    return this._getSideNavTab().click()
  }

  // statusPanel
  _getStatusPanel(){
    return this._browser.findElement( By.css('[mat-drawer-status-panel]') )
  }

  async statusPanelIsVisible() {
    try {
      return await this._getStatusPanel().isDisplayed()
    } catch (e) {
      return false
    }
  }

  clickStatusPanel() {
    // Will throw if status panel is not visible
    return this._getStatusPanel().click()
  }
}

class WdIavPage extends WdLayoutPage{
  constructor(){
    super()
  }

  async clearAllSelectedRegions() {
    const clearAllRegionBtn = await this._browser.findElement(
      By.css('[aria-label="Clear all regions"]')
    )
    await clearAllRegionBtn.click()
    await this.wait(500)
  }

  async waitUntilAllChunksLoaded(){
    const checkReady = async () => {
      const el = await this._browser.findElements(
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
    const floatingContainer = await this._browser.findElement(
      By.css('div[floatingMouseContextualContainerDirective]')
    )

    const text = await floatingContainer.getText()
    return text
  }

  async selectDropdownTemplate(title) {
    const templateBtn = await this._getSideNav()
      .findElement( By.tagName('viewer-state-controller') )
      .findElement( By.css('[aria-label="Select a new template"]') )
    await templateBtn.click()

    const options = await this._browser.findElements(
      By.tagName('mat-option')
    )
    const idx = await _getIndexFromArrayOfWebElements(title, options)
    if (idx >= 0) await options[idx].click()
    else throw new Error(`${title} is not found as one of the dropdown templates`)
  }

  _getSearchRegionInput(){
    return this._getSideNav()
      .findElement( By.css(`[aria-label="${regionSearchAriaLabelText}"]`) )
  }

  async searchRegionWithText(text=''){
    const searchRegionInput = await this._getSearchRegionInput()
    await searchRegionInput
      .sendKeys(
        Key.chord(Key.CONTROL, 'a'),
        text
      )
  }

  async clearSearchRegionWithText() {
    const searchRegionInput = await this._getSearchRegionInput()
    await searchRegionInput
      .sendKeys(
        Key.chord(Key.CONTROL, 'a'),
        Key.BACK_SPACE,
        Key.ESCAPE
      )
  }

  async _getAutcompleteOptions(){
    const input = await this._getSearchRegionInput()
    const autocompleteId = await input.getAttribute('aria-owns')
    const el = await this._browser.findElement( By.css( `[id=${autocompleteId}]` ) )
    return this._browser
      .findElement( By.id( autocompleteId ) )
      .findElements( By.tagName('mat-option') )
  }

  async getSearchRegionInputAutoCompleteOptions(){
    const options = await this._getAutcompleteOptions()
    return await Promise.all(
      options.map(_getTextFromWebElement)
    )
  }

  async selectSearchRegionAutocompleteWithText(text = ''){

    const options = await this._getAutcompleteOptions()

    const idx = await _getIndexFromArrayOfWebElements(text, options)
    if (idx >= 0) {
      await options[idx].click()
    } else {
      throw new Error(`_getIndexFromArrayOfWebElements ${text} option not founds`)
    }
  }

  async getVisibleDatasets() {
    const singleDatasetListView = await this._browser
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
    const ngContainer = await this._browser.findElement(
      By.id('neuroglancer-container')
    )
    const canvas = await ngContainer.findElement(
      By.tagName('canvas')
    )
    return !!canvas
  }

  async getNavigationState() {
    const actualNav = await this._browser.executeScript(async () => {
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
    this._browser = null
    this._page = null
  }

  async init() {
    this._browser = browser

    this._page = await this._browser.newPage()
    await this._page.setViewport({
      width: 1600,
      height: 900
    })
  }

  async goto(url = '/') {
    const actualUrl = getActualUrl(url)
    await this._page.goto(actualUrl, { waitUntil: 'networkidle2' })
  }

  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    await this._page.waitFor(ms)
  }
}

exports.waitMultiple = process.env.WAIT_ULTIPLE || 1

exports.AtlasPage = WdIavPage
exports.LayoutPage = WdLayoutPage