const { By } = require('selenium-webdriver')

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

module.exports = {
  polyFillClick
}
