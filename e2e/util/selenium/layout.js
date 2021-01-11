const { WdBase } = require('./base')
const {
  _getIndexFromArrayOfWebElements,
  _getTextFromWebElement,
  _compareText
} = require('./util')
const { ARIA_LABELS } = require('../../../common/constants')

class WdLayoutPage extends WdBase{
  constructor(){
    super()
  }

  /**
   * Dropdown
   */
  /**
   * 
   * @param {string} cssSelector for the mat-select DOM element 
   * @param {string|RegExp} optionStrRegExp substring that option's text node contains, or regexp whose .test method will be called on text node of the option
   * @returns void
   * @description finds a mat-select DOM element, then selects a mat-option attached to the mat-select element
   */
  async selectDropdownOption(cssSelector, optionStrRegExp){
    if (!cssSelector) throw new Error(`cssSelector is required for selectDropdownOption method`)
    const selectEl = await this._browser.findElement(
      By.css(cssSelector)
    )
    if (!selectEl) throw new Error(`element with ${cssSelector} could not be found`)
    const tagName = await selectEl.getTagName()
    if (tagName !== 'mat-select') throw new Error(`cssSelector ${cssSelector} did not return a mat-select element, but returned a tagName element`)
    await selectEl.click()
    await this.wait(500)
    const ariaOwnsAttr = await selectEl.getAttribute('aria-owns')

    const opts = []
    for (const ariaOwnEntry of ariaOwnsAttr.split(' ')) {
      const matOpt = await this._browser.findElement(
        By.css(`mat-option#${ariaOwnEntry}`)
      )
      const txt = await matOpt.getText()
      if (_compareText(txt, optionStrRegExp)) {
        await matOpt.click()
        return
      }
    }
    throw new Error(`option ${optionStrRegExp} not found.`)
  }

  /**
   * Snackbar
   */
  async getSnackbarMessage(){
    const txt = await this._driver
      .findElement( By.css('simple-snack-bar') )
      .findElement( By.css('span') )
      .getText()
    return txt
  }

  async clickSnackbarAction(){
    await this._driver
      .findElement( By.css('simple-snack-bar') )
      .findElement( By.css('button') )
      .click()
  }

  /**
   * Bottomsheet
   */
  _getBottomSheet() {
    return this._driver.findElement( By.css('mat-bottom-sheet-container') )
  }

  _getBottomSheetList(){
    return this._getBottomSheet().findElements( By.css('mat-list-item') )
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

  /**
   * Modal
   */
  _getModal(){
    return this._browser.findElement( By.css('mat-dialog-container') )
  }

  async dismissModal() {
    try {
      const okBtn = await this._getModal()
        .findElement( By.css('mat-dialog-actions') )
        .findElement( By.css('button[color="primary"]') )
      await okBtn.click()
    } catch (e) {
      
    }
  }

  _getModalBtns(){
    return this._getModal().findElements( By.tagName('button') )
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

  /**
   * 
   * @param {string|RegExp} text 
   * @description search criteria for the btn to click
   */
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

  /**
   * ExpansionPanel
   */

  /**
   * 
   * @param {string|RegExp} text 
   * @description search criteria for the expansion panel title
   */
  async _getExpansionPanel(text){
    const expPanels = await this._browser.findElements(
      By.css(`mat-expansion-panel`)
    )

    const expPanelHdrs = []
    for (const expPanel of expPanels) {
      expPanelHdrs.push(
        await expPanel.findElement(
          By.css(`mat-expansion-panel-header`)
        )
      )
    }

    const idx = await _getIndexFromArrayOfWebElements(text, expPanelHdrs)
    return idx >= 0 && expPanels[idx]
  }

  /**
   * 
   * @param {Object} expPanel webelement of the mat expansion panel
   * @returns {Promise<boolean>} 
   */
  async _expansionPanelIsOpen(expPanel){
    const classString = await expPanel.getAttribute('class')
    /**
     * mat-expanded gets appended when mat-expansion panel is set to open
     */
    return classString.indexOf('mat-expanded') >= 0
  }

  /**
   * 
   * @param {string|RegExp} name Text of the expansion panel header
   * @param {boolean} flag @optional State to set the expansion panel. Leave empty for toggle.
   */
  async toggleExpansionPanelState(name, flag){
    const expPanel = await this._getExpansionPanel(name)
    if (!expPanel) throw new Error(`expansionPanel ${name} could not be found`)
    if (typeof flag === 'undefined') {
      await expPanel.findElement(
        By.css(`mat-expansion-panel-header`)
      ).click()
      return
    } 
    
    const currentOpen = await this._expansionPanelIsOpen(expPanel)
    if (currentOpen !== flag) {
      await expPanel.findElement(
        By.css(`mat-expansion-panel-header`)
      ).click()
    }
  }

  /**
   * Chips
   */
  async _getChips(){
    return await this._browser.findElements(
      By.css('mat-chip')
    )
  }

  async getAllChipsText(){
    const texts = []
    const webEls = await this._getChips()
    for (const el of webEls) {
      texts.push(
        await _getTextFromWebElement(el)
      )
    }
    return texts
  }

  async getAllChipsVisibility(){
    const visibility = []
    const webEls = await this._getChips()
    for (const el of webEls) {
      visibility.push(
        await el.isDisplayed()
      )
    }
    return visibility
  }

  async clickChip(search, cssSelector) {
    const allChips = await this._getChips()
    const idx = await _getIndexFromArrayOfWebElements(search, allChips)
    if (idx < 0) throw new Error(`clickChip ${search.toString()} not found`)
    if (!cssSelector) {
      return await allChips[idx].click()
    }
    const el = await allChips[idx].findElement(
      By.css(cssSelector)
    )
    if (!el) throw new Error(`clickChip css selector ${cssSelector} not found`)
    return await el.click()
  }

  /**
   * Cards
   */

  async _getAllCards(){
    return await this._browser.findElements(
      By.css('mat-card')
    )
  }

  async getAllCardsText(){
    const allCardsEl = await this._getAllCards()
    const txtArr = []
    for (const el of allCardsEl) {
      txtArr.push(
        await _getTextFromWebElement(el)
      )
    }
    return txtArr
  }

  /**
   * Badge
   */
  async getBadgeContentByDesc(description){
    const els = await this._browser.findElements(
      By.css(`.mat-badge-content`)
    )
    for (const el of els) {
      const descById = await el.getAttribute('aria-describedby')
      if (!!descById) {
        const descEl = await this._browser.findElement(
          By.id(`${descById}`)
        )
        /**
         * getText() will not return elements that are hidden
         * which aria descriptions are.
         * so use getInnerHtml instead
         */
        const descElText = await descEl.getAttribute('innerHTML')
        if (descElText === description) {
          const elText = await el.getText()
          return elText
        }
      }
    }
    return null
  }

  /**
   * Other
   */
  async _findTitleCard(title) {
    const titleCards = await this._browser
      .findElement( By.css('ui-splashscreen') )
      .findElements( By.css('mat-card') )
    const idx = await _getIndexFromArrayOfWebElements(title, titleCards)
    if (idx >= 0) return titleCards[idx]
    else throw new Error(`${title} does not fit any titleCards`)
  }

  async selectTitleCard( title ) {
    const titleCard = await this._findTitleCard(title)
    await titleCard.click()
  }

  async selectTitleTemplateParcellation(templateName, parcellationName){
    throw new Error(`selectTitleTemplateParcellation has been deprecated. use setAtlasSpecifications`)
  }

  /**
   * _setAtlasSelectorExpanded
   * toggle/set the open state of the atlas-layer-selector element
   * If the only argument (flag) is not provided, it will toggle the atlas-layer-selector
   * 
   * Will throw if atlas-layer-selector is not in the DOM
   * 
   * @param {boolean} flag 
   * 
   */
  async _setAtlasSelectorExpanded(flag) {
    const atlasLayerSelectorEl = this._browser.findElement(
      By.css('atlas-layer-selector')
    )
    const openedFlag = (await atlasLayerSelectorEl.getAttribute('data-opened')) === 'true'
    if (typeof flag === 'undefined' || flag !== openedFlag) {
      await atlasLayerSelectorEl.findElement(By.css(`button[aria-label="${ARIA_LABELS.TOGGLE_ATLAS_LAYER_SELECTOR}"]`)).click()
    }
  }

  async selectTile(tileName){
    if (!tileName) throw new Error(`tileName needs to be provided`)
    await this._setAtlasSelectorExpanded(true)
    await this.wait(1000)
    const allTiles = await this._browser.findElements( By.css(`mat-grid-tile`) )

    const idx = await _getIndexFromArrayOfWebElements(tileName, allTiles)
    if (idx >= 0) await allTiles[idx].click()
    else throw new Error(`#selectTile: tileName ${tileName} cannot be found.`)
  }

  async changeParc(parcName) {
    throw new Error(`changeParc NYI`)
  }

  async changeParcVersion(parcVerion) {
    throw new Error(`changeParcVersion NYI`)
  }

  async setAtlasSpecifications(atlasName, atlasSpecifications = [], parcVersion = null) {
    if (!atlasName) throw new Error(`atlasName needs to be provided`)
    try {
      /**
       * if at title screen
       */
      await (await this._findTitleCard(atlasName)).click()
    } catch (e) {
      /**
       * if not at title screen
       * select from dropdown
       */
      console.log(e)
      await this.selectDropdownOption(`[aria-label="${ARIA_LABELS.SELECT_ATLAS}"]`, atlasName)
    }

    for (const spec of atlasSpecifications) {
      await this.wait(1000)
      await this.waitUntilAllChunksLoaded()
      await this.selectTile(spec)
    }

    if (parcVersion) {
      await this.wait(1000)
      await this.waitUntilAllChunksLoaded()
      await this.changeParcVersion(parcVersion)
    }

    try {
      await this._setAtlasSelectorExpanded(false)
    } catch (e) {
      /**
       * atlas selector may not be found
       */
    }
  }

  /**
   * Sidenav
   */
  _getSideNavPrimary(){
    return this._browser.findElement(
      By.css('mat-drawer[data-mat-drawer-top-open]')
    )
  }

  async _getSideNavPrimaryExpanded(){
    return (await this._getSideNavPrimary()
      .getAttribute('data-mat-drawer-top-open')) === 'true'
  }

  _getSideNavSecondary(){
    return this._browser.findElement(
      By.css('mat-drawer[data-mat-drawer-fullleft-open]')
    )
  }

  async _getSideNavSecondaryExpanded(){
    return (await this._getSideNavSecondary()
      .getAttribute('data-mat-drawer-fullleft-open')) === 'true'
  }

  async _setSideNavPrimaryExpanded(flag) {
    const openedFlag = await this._getSideNavPrimaryExpanded()
    if (typeof flag === 'undefined' || flag !== openedFlag) {
      await this._browser.findElement(By.css(`button[aria-label="${ARIA_LABELS.TOGGLE_SIDE_PANEL}"]`)).click()
    }
  }

  async getSideNavTag(){
    return await this._browser
      .findElement( By.css('[mat-drawer-trigger]') )
      .findElement( By.css('i') )
  }

  sideNavIsVisible(){
    throw new Error(`sideNavIsVisible is deprecated`)
  }

  _getSideNavTab(){
    return this._browser
      .findElement( By.css('[mat-drawer-trigger]') )
      .findElement( By.css('i') )
  }

  sideNavTabIsVisible(){
    return this._getSideNavTab().isDisplayed()
  }

  clickSideNavTab(){
    return this._getSideNavTab().click()
  }

  /**
   * StatusPanel
   */
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

  async getTemplateInfo(){
    throw new Error(`getTemplateInfo has been deprecated. Implmenet new method of getting info`)
  }

  // will throw if additional layer control is not visible
  additionalLayerControlIsExpanded() {
    throw new Error(`additionalLayerControlIsExpanded is deprecated`)
  }

  /**
   * TODO? deprecate
   */
  async toggleNthLayerControl(idx) {
    const els = await this._browser
      .findElement(
        By.css(`[aria-label="${ARIA_LABELS.ADDITIONAL_VOLUME_CONTROL}"]`)
      )
      .findElements( By.css(`[aria-label="${ARIA_LABELS.TOGGLE_SHOW_LAYER_CONTROL}"]`))
    if (!els[idx]) throw new Error(`toggleNthLayerControl index out of bound: accessor ${idx} with length ${els.length}`)
    await els[idx].click()
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

module.exports = {
  WdLayoutPage,
  WdBase,
}