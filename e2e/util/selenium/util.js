
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

function _compareText(textString, testStrRegExp){
  return testStrRegExp instanceof RegExp
    ? testStrRegExp.test(textString)
    : textString.indexOf(testStrRegExp) >= 0
}

module.exports = {
  _getTextFromWebElement,
  _getIndexFromArrayOfWebElements,
  _compareText
}