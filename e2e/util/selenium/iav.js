const { WdLayoutPage, WdBase } = require('./layout')
const { ARIA_LABELS, CONST } = require('../../../common/constants')
const { _getTextFromWebElement, _getIndexFromArrayOfWebElements } = require('./util')
const { Key } = require('selenium-webdriver')

class WdIavPage extends WdLayoutPage{
  constructor(){
    super()
  }

  async clearAllSelectedRegions() {
    const clearAllRegionBtn = await this._browser.findElement(
      By.css(`[aria-label="${ARIA_LABELS.CLEAR_SELECTED_REGION}"]`)
    )
    await clearAllRegionBtn.click()
    await this.wait(500)
  }

  async waitUntilAllChunksLoaded(){
    await this.waitForCss(`ui-nehuba-container`)
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

  async getFloatingCtxInfoAsText(){
    const floatingContainer = await this._browser.findElement(
      By.css('div[floatingMouseContextualContainerDirective]')
    )

    const text = await floatingContainer.getText()
    return text
  }

  async selectDropdownTemplate(title) {
    throw new Error(`selectDropdownTemplate has been deprecated. use setAtlasSpecifications instead`)
  }

  async _getSearchRegionInput(){
    await this._setSideNavPrimaryExpanded(true)
    await this.wait(500)
    const secondaryOpen = await this._getSideNavSecondaryExpanded()
    if (secondaryOpen) {
      return this._getSideNavSecondary().findElement( By.css(`[aria-label="${ARIA_LABELS.TEXT_INPUT_SEARCH_REGION}"]`) )
    } else {
      return this._getSideNavPrimary().findElement( By.css(`[aria-label="${ARIA_LABELS.TEXT_INPUT_SEARCH_REGION}"]`) )
    }
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

  _getModalityListView(){
    return this._browser
      .findElement( By.css('modality-picker') )
      .findElements( By.css('mat-checkbox') )
  }

  async getModalities(){
    const els = await this._getModalityListView()
    const returnArr = []
    for (const el of els) {
      returnArr.push(
        await el.getText()
      )
    }
    return returnArr
  }

  _getSingleDatasetListView(){
    return this._browser
      .findElement( By.css('data-browser') )
      .findElements( By.css('single-dataset-list-view') )
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
    if (!this.__trackingNavigationState__) {
      await this._browser.executeScript(async () => {
        window.__iavE2eNavigationState__ = {}
        
        const getPr = () => new Promise(rs => {
  
          window.__iavE2eNavigationStateSubptn__ = nehubaViewer.navigationState.all
            .subscribe(({ orientation, perspectiveOrientation, perspectiveZoom, position, zoom }) => {
              window.__iavE2eNavigationState__ = {
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
      })

      this.__trackingNavigationState__ = true
    }

    const returnVal = await this._browser.executeScript(() => window.__iavE2eNavigationState__)
    return returnVal
  }

}

module.exports = {
  WdIavPage,
  WdLayoutPage,
  WdBase,
}