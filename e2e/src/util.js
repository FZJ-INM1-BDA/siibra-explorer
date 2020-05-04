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

const verifyPosition = position => {

  if (!position) throw new Error(`cursorGoto: position must be defined!`)
  const x = Array.isArray(position) ? position[0] : position.x
  const y = Array.isArray(position) ? position[1] : position.y
  if (!x) throw new Error(`cursorGoto: position.x or position[0] must be defined`)
  if (!y) throw new Error(`cursorGoto: position.y or position[1] must be defined`)

  return {
    x,
    y
  }
}

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

  historyBack() {
    return this._browser.navigate().back()
  }

  historyForward() {
    return this._browser.navigate().forward()
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

  async waitForAsync(){

    const checkReady = async () => {
      const el = await this._browser.findElements(
        By.css('.spinnerAnimationCircle')
      )
      return !el.length
    }

    do {
      // Do nothing, until ready
    } while (
      await this.wait(100),
      !(await checkReady())
    )
  }

  async cursorMoveTo({ position }) {
    const { x, y } = verifyPosition(position)
    return this._driver.actions()
      .move()
      .move({
        x,
        y,
        duration: 1000
      })
      .perform()
  }

  async scrollElementBy(cssSelector, options) {
    const { delta } = options
    await this._browser.executeScript(() => {
      const { delta } = arguments[1]
      const el = document.querySelector(arguments[0])
      el.scrollBy(...delta)
    }, cssSelector, { delta })
  }

  async getScrollStatus(cssSelector) {
    const val = await this._browser.executeScript(() => {
      const el = document.querySelector(arguments[0])
      return el.scrollTop
    }, cssSelector)
    return val
  }

  async cursorMoveToAndClick({ position }) {
    const { x, y } = verifyPosition(position)
    return this._driver.actions()
      .move()
      .move({
        x,
        y,
        duration: 1000
      })
      .click()
      .perform()
  }

  async cursorMoveToAndDrag({ position, delta }) {
    const { x, y } = verifyPosition(position)
    const { x: deltaX, y: deltaY } = verifyPosition(delta)
    return this._driver.actions()
      .move()
      .move({
        x,
        y,
        duration: 1000
      })
      .press()
      .move({
        x: x + deltaX,
        y: y + deltaY,
        duration: 1000
      })
      .release()
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

  // it seems if you set intercept http to be true, you might also want ot set do not automat to be true
  async goto(url = '/', { interceptHttp, doNotAutomate } = {}){
    const actualUrl = getActualUrl(url)
    if (interceptHttp) {
      this._browser.get(actualUrl)
      await this.initHttpInterceptor() 
    } else {
      await this._browser.get(actualUrl)
    }

    // if doNotAutomate is not set
    // should wait for async operations to end 
    if (!doNotAutomate) {
      await this.wait(200)
      await this.dismissModal()
      await this.wait(200)
      await this.waitForAsync()
    }
  }

  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    await this._browser.sleep(ms)
  }

  async waitFor(animation = false, async = false){
    if (animation) await this.wait(500)
    if (async) await this.waitForAsync()
  }

  async getSnackbarMessage(){
    const txt = await this._driver
      .findElement( By.tagName('simple-snack-bar') )
      .findElement( By.tagName('span') )
      .getText()
    return txt
  }

  async clickSnackbarAction(){
    await this._driver
      .findElement( By.tagName('simple-snack-bar') )
      .findElement( By.tagName('button') )
      .click()
  }

  _getBottomSheet() {
    return this._driver.findElement( By.tagName('mat-bottom-sheet-container') )
  }

  _getBottomSheetList(){
    return this._getBottomSheet().findElements( By.tagName('mat-list-item') )
  }

  async getBottomSheetList(){
    const listItems = await this._getBottomSheetList()
    const output = []
    for (const item of listItems) {
      output.push(
        await _getTextFromWebElement(item)
      )
    }
    return output
  }

  async clickNthItemFromBottomSheetList(index, cssSelector){

    const list = await this._getBottomSheetList()

    if (!list[index]) throw new Error(`index out of bound: ${index} in list with size ${list.length}`)

    if (cssSelector) {
      await list[index]
        .findElement( By.css(cssSelector) )
        .click()
    } else {
      await list[index].click()
    }
  }

  async clearAlerts() {
    await this._driver
      .actions()
      .sendKeys(
        Key.ESCAPE,
        Key.ESCAPE,
        Key.ESCAPE,
        Key.ESCAPE
      )
      .perform()

    await this.wait(500)
  }

  async execScript(fn, ...arg){
    const result = await this._driver.executeScript(fn)
    return result
  }
}

class WdLayoutPage extends WdBase{

  constructor(){
    super()
  }

  _getModal(){
    return this._browser.findElement( By.tagName('mat-dialog-container') )
  }

  async dismissModal() {
    try {
      const okBtn = await this._getModal()
        .findElement( By.tagName('mat-dialog-actions') )
        .findElement( By.css('button[color="primary"]') )
      await okBtn.click()
    } catch (e) {
      
    }
  }

  _getModalBtns(){
    return this._getModal()
      .findElement( By.tagName('mat-card-actions') )
      .findElements( By.tagName('button') )
  }

  async getModalText(){
    const el = await this._getModal()
    const txt = await _getTextFromWebElement(el)
    return txt
  }

  async getModalActions(){
    const btns = await this._getModalBtns()

    const arr = []
    for (const btn of btns){
      arr.push(await _getTextFromWebElement(btn))
    }
    return arr
  }

  async modalHasChild(cssSelector){
    try {
      const isDisplayed = await this._getModal()
        .findElement( By.css( cssSelector ) )
        .isDisplayed()
      return isDisplayed
    } catch (e) {
      console.warn(`modalhaschild thrown error`, e)
      return false
    }
  }

  // text can be instance of regex or string
  async clickModalBtnByText(text){
    const btns = await this._getModalBtns()
    const arr = await this.getModalActions()
    if (typeof text === 'string') {
      const idx = arr.indexOf(text)
      if (idx < 0) throw new Error(`clickModalBtnByText: ${text} not found.`)
      await btns[idx].click()
      return
    }
    if (text instanceof RegExp) {
      const idx = arr.findIndex(item => text.test(item))
      if (idx < 0) throw new Error(`clickModalBtnByText: regexp ${text.toString()} not found`)
      await btns[idx].click()
      return
    }

    throw new Error(`clickModalBtnByText arg must be instance of string or regexp`)
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

  // will throw if sidenav is not visible
  async getTemplateInfo(){
    const ariaText = `Hover to find out more info on the selected template`
    const infoBtn = await this._getSideNav()
      .findElement( By.css(`[aria-label="${ariaText}"]`) )
    
    await this._driver.actions()
      .move()
      .move({
        origin: infoBtn,
        duration: 1000
      })
      .perform()

    await this.wait(500)
    const text = await this._getSideNav()
      .findElement( By.id('selected-template-detailed-info') )
      .getText()

    return text
  }

  _getAdditionalLayerControl(){
    return this._browser.findElement(
      By.css('[aria-label="Additional volumes control"]')
    )
  }

  async additionalLayerControlIsVisible(){
    try {
      return await this._getAdditionalLayerControl().isDisplayed()
    } catch (e) {
      return false
    }
  }

  // will throw if additional layer contorl is not visible
  additionalLayerControlIsExpanded() {
    return this._getAdditionalLayerControl()
      .findElement(
        By.tagName('layer-browser')
      )
      .isDisplayed()
  }

  // will throw if additional layer contorl is not visible
  async toggleLayerControl(){
    return this._getAdditionalLayerControl()
      .findElement(
        By.css('[aria-label="Toggle expansion state of additional layer browser"]')
      )
      .click()
  }

  // Signin banner
  _getToolsIcon(){
    return this._driver
      .findElement( By.css('[aria-label="Show tools and plugins"]') )
  }

  async showToolsMenu(){
    await this._getToolsIcon().click()
  }

  _getToolsMenu(){
    return this._driver
      .findElement( By.css('[aria-label="Tools and plugins menu"]') )
  }

  _getAllTools(){
    return this._getToolsMenu().findElements( By.css('[role="menuitem"]') )
  }

  async getVisibleTools(){
    // may throw if tools menu not visible
    const menuItems = await this._getAllTools()
    const returnArr = []
    for (const menuItem of menuItems){
      returnArr.push(
        await _getTextFromWebElement(menuItem)
      )
    }
    return returnArr
  }

  async clickOnNthTool(index, cssSelector){
    const menuItems = await this._getAllTools()
    if (!menuItems[index]) throw new Error(`index out of bound: accessing index ${index} of length ${menuItems.length}`)
    if (cssSelector) await menuItems[index].findElement( By.css(cssSelector) ).click()
    else await menuItems[index].click()
  }

  // other templates
  async showOtherTemplateMenu(){
    await this._driver
      .findElement( By.css('[aria-label="Show availability in other reference spaces"]') )
      .click()
  }

  _getOtherTemplateMenu(){
    return this._driver
      .findElement( By.css('[aria-label="Availability in other reference spaces"]') )
  }

  _getAllOtherTemplates(){
    return this._getOtherTemplateMenu().findElements( By.css('[mat-menu-item]') )
  }

  async getAllOtherTemplates(){
    const els = await this._getAllOtherTemplates()
    const returnArr = []
    for (const el of els) {
      returnArr.push(await _getTextFromWebElement(el))
    }
    return returnArr
  }

  async clickNthItemAllOtherTemplates(index){
    const arr = await this._getAllOtherTemplates()
    if (!arr[index]) throw new Error(`index out of bound: trying to access ${index} from arr with length ${arr.length}`)
    await arr[index].click()
  }

  _getFavDatasetIcon(){
    return this._driver
      .findElement( By.css('[aria-label="Show pinned datasets"]') )
  }

  async getNumberOfFavDataset(){
    const attr = await this._getFavDatasetIcon().getAttribute('pinned-datasets-length')
    return Number(attr)
  }

  async showPinnedDatasetPanel(){
    await this._getFavDatasetIcon().click()
    await this.wait(500)
  }

  _getPinnedDatasetPanel(){
    return this._driver
      .findElement(
        By.css('[aria-label="Pinned datasets panel"]')
      )
  }

  async getPinnedDatasetsFromOpenedPanel(){
    const list = await this._getPinnedDatasetPanel()
      .findElements(
        By.tagName('mat-list-item')
      )

    const returnArr = []
    for (const el of list) {
      const text = await _getTextFromWebElement(el)
      returnArr.push(text)
    }
    return returnArr
  }

  async unpinNthDatasetFromOpenedPanel(index){
    const list = await this._getPinnedDatasetPanel()
      .findElements(
        By.tagName('mat-list-item')
      )

    if (!list[index]) throw new Error(`index out of bound: ${index} in list with size ${list.length}`)
    await list[index]
      .findElement( By.css('[aria-label="Toggle pinning this dataset"]') )
      .click()
  }

  _getWidgetPanel(title){
    return this._driver.findElement( By.css(`[aria-label="Widget for ${title}"]`) )
  }

  async widgetPanelIsDispalyed(title){
    try {
      const isDisplayed = await this._getWidgetPanel(title).isDisplayed()
      return isDisplayed
    } catch (e) {
      console.warn(`widgetPanelIsDisplayed error`, e)
      return false
    }
  }

  async closeWidgetByname(title){
    await this._getWidgetPanel(title)
      .findElement( By.css(`[aria-label="close"]`) )
      .click()
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

  _getSingleDatasetListView(){
    return this._browser
      .findElement( By.tagName('data-browser') )
      .findElement( By.css('div.cdk-virtual-scroll-content-wrapper') )
      .findElements( By.tagName('single-dataset-list-view') )
  }

  async getVisibleDatasets() {
    const singleDatasetListView = await this._getSingleDatasetListView()

    const returnArr = []
    for (const item of singleDatasetListView) {
      returnArr.push( await item.getText() )
    }
    return returnArr
  }

  async clickNthDataset(index){
    if (!Number.isInteger(index)) throw new Error(`index needs to be an integer`)
    const list = await this._getSingleDatasetListView()
    await list[index].click()
  }

  async togglePinNthDataset(index) {
    if (!Number.isInteger(index)) throw new Error(`index needs to be an integer`)
    const list = await this._getSingleDatasetListView()
    if (!list[index]) throw new Error(`out of bound ${index} in list with length ${list.length}`)
    await list[index]
      .findElement( By.css('[aria-label="Toggle pinning this dataset"]') )
      .click()
  }

  async viewerIsPopulated() {
    try {
      const ngContainer = await this._browser.findElement(
        By.id('neuroglancer-container')
      )
      if (! (await ngContainer.isDisplayed())) {
        return false
      }
      const canvas = await ngContainer.findElement(
        By.tagName('canvas')
      )
      if (!(await canvas.isDisplayed())) {
        return false
      }
      return true
    } catch (e) {
      return false
    }
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
