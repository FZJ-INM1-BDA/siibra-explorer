
function _getTextFromWebElement(webElement) {
  return webElement.getText()
}

async function _getIndexFromArrayOfWebElements(search, webElements) {
  const texts = await Promise.all(
    webElements.map(_getTextFromWebElement)
  )
  return texts.findIndex(text => search instanceof RegExp
      ? search.test(text)
      : text.indexOf(search) >= 0)
}

module.exports = {
  _getTextFromWebElement,
  _getIndexFromArrayOfWebElements
}