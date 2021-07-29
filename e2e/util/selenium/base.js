const CITRUS_LIGHT_URL = `https://unpkg.com/citruslight@0.1.0/citruslight.js`
const { By, Key, until } = require('selenium-webdriver')
const { retry } = require('../../../common/util')
const chromeOpts = require('../../chromeOpts')
const ATLAS_URL = (process.env.ATLAS_URL || 'http://localhost:3000').replace(/\/$/, '')

function getActualUrl(url) {
  return /^http\:\/\//.test(url) ? url : `${ATLAS_URL}/${url.replace(/^\//, '')}`
}

async function polyFillClick(cssSelector){
  if (!cssSelector) throw new Error(`click method needs to define a css selector`)
  const webEl = this._browser.findElement( By.css(cssSelector) )
  try {
    await webEl.click()
  } catch (e) {
    const id = await webEl.getAttribute('id')
    const newId = id.replace(/-input$/, '')
    await this._browser.findElement(
      By.id(newId)
    ).click()
  }
}

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
    globalThis.IAVBase = this
  }
  get _browser(){
    return browser
  }
  get _driver(){
    return this._browser.driver
  }

  async highlightElement(cssSelector) {

    await this._browser.executeAsyncScript(async () => {
      const cb = arguments[arguments.length - 1]
      const moduleUrl = arguments[0]
      const cssSelector = arguments[1]

      const el = document.querySelector(cssSelector)
      if (!el) throw new Error(`css selector not fetching anything`)
      import(moduleUrl)
        .then(async m => {
          m.citruslight(el)
          cb()
        })
    }, CITRUS_LIGHT_URL, cssSelector)

    await this.wait(1000)

    return async () => {
      await this._browser.executeAsyncScript(async () => {
        const cb = arguments[arguments.length - 1]
        const moduleUrl = arguments[0]

        import(moduleUrl)
          .then(async m => {
            m.clearAll()
            cb()
          })
      }, CITRUS_LIGHT_URL)
    }
  }

  // without image header
  // output as b64 png
  async takeScreenshot(cssSelector){
    
    let cleanUp
    if(cssSelector) {
      cleanUp= await this.highlightElement(cssSelector)
    }
    
    const result = await this._browser.takeScreenshot()

    if (cleanUp) {
      await cleanUp()
    }
    
    await this.wait(1000)
    return result
  }

  async getLog() {
    const browserLog = await this._browser.manage().logs().get('browser')
    return browserLog
  }

  async getRgbAt({ position } = {}, cssSelector = null){
    if (!position) throw new Error(`position is required for getRgbAt`)
    const { x, y } = verifyPosition(position)
    const screenshotData = await this.takeScreenshot(cssSelector)
    const [ red, green, blue ] = await this._driver.executeAsyncScript(() => {
      
      const dataUri = arguments[0]
      const pos = arguments[1]
      const dim = arguments[2]
      const cb = arguments[arguments.length - 1]

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = dim[0]
        canvas.height = dim[1]

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, dim[0], dim[1])

        const idx = (dim[0] * pos[1] + pos[0]) * 4
        const red = imgData.data[idx]
        const green = imgData.data[idx + 1]
        const blue = imgData.data[idx + 2]
        cb([red, green, blue])
      }
      img.src = dataUri

    }, `data:image/png;base64,${screenshotData}`, [x, y], [800, 796])

    return { red, green, blue }
  }

  async switchIsChecked(cssSelector){
    if (!cssSelector) throw new Error(`switchChecked method requies css selector`)
    const checked = await this._browser
      .findElement( By.css(cssSelector) )
      .getAttribute('aria-checked')
    return checked === 'true'
  }

  async click(cssSelector){
    return await polyFillClick.bind(this)(cssSelector)
  }

  async getText(cssSelector){
    if (!cssSelector) throw new Error(`getText needs to define css selector`)
    const el = await this._browser.findElement( By.css(cssSelector) )
    
    const text = await el.getText()
    return text
  }

  async isVisible(cssSelector) {

    if (!cssSelector) throw new Error(`getText needs to define css selector`)
    const el = await this._browser.findElement( By.css(cssSelector) )
    const isDisplayed = await el.isDisplayed()

    return isDisplayed
  }

  async areVisible(cssSelector){
    if (!cssSelector) throw new Error(`getText needs to define css selector`)
    const els = await this._browser.findElements( By.css( cssSelector ) )
    const returnArr = []

    for (const el of els) {
      returnArr.push(await el.isDisplayed())
    }
    return returnArr
  }

  async isAt(cssSelector){
    if (!cssSelector) throw new Error(`getText needs to define css selector`)
    const { x, y, width, height } = await this._browser.findElement( By.css(cssSelector) ).getRect()
    return { x, y, width, height }
  }

  async areAt(cssSelector){

    if (!cssSelector) throw new Error(`getText needs to define css selector`)
    const els = await this._browser.findElements( By.css( cssSelector ) )
    const returnArr = []

    for (const el of els) {
      const { x, y, width, height } = await el.getRect()
      returnArr.push({ x, y, width, height })
    }
    return returnArr
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

    await this._browser.wait(async () => {
      const els = await this._browser.findElements(
        By.css('div.loadingIndicator')
      )
      const els2 = await this._browser.findElements(
        By.css('.spinnerAnimationCircle')
      )
      return [...els, ...els2].length === 0
    }, 1e3 * 60 * 10)
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

  async cursorMoveToElement(cssSelector) {
    if (!cssSelector) throw new Error(`cursorMoveToElement needs to define css selector`)
    const el = await this._browser.findElement( By.css(cssSelector) )
    await this._driver.actions()
      .move()
      .move({
        origin: el,
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
  async goto(url = '/', { interceptHttp, doNotAutomate, forceTimeout = 20 * 1000 } = {}){
    this.__trackingNavigationState__ = false
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
      await this.clearAlerts()
      await this.wait(200)

      if (forceTimeout) {
        await Promise.race([
          this.waitForAsync(),
          this.wait(forceTimeout)
        ])
      } else {
        await this.waitForAsync()
      }
    }
  }

  async wait(ms) {
    if (!ms) throw new Error(`wait duration must be specified!`)
    return new Promise(rs => {
      setTimeout(rs, ms)
    })
  }

  async waitForCss(cssSelector) {
    if (!cssSelector) throw new Error(`css selector must be defined`)
    await this._browser.wait(
      until.elementLocated( By.css(cssSelector) ),
      1e3 * 60 * 10
    )
  }

  async waitFor(animation = false, async = false){
    if (animation) await this.wait(500)
    if (async) await this.waitForAsync()
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

module.exports = {
  WdBase
}
