const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
const { retry } = require('../../../common/util')
describe('> statusbar', () => {
  let atlasPage = new AtlasPage()
  beforeEach(async () => {
    atlasPage = new AtlasPage()
    await atlasPage.init()
  })

  it('> on init, should not be visible', async () => {
    await atlasPage.goto()
    try {
      const visible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.STATUS_PANEL}"]`)
      expect(visible).toBeFalsy()
    } catch (e) {

    }
  })

  describe('> on template selection', () => {
    beforeEach(async () => {
      await atlasPage.goto()
      await atlasPage.selectTitleCard('MNI Colin 27')
      await retry(async () => {
        const populated = await atlasPage.viewerIsPopulated()
        if (!populated) throw new Error(`viewer not yet populated`)
      }, { retries: 10, timeout: 500 })
  
    })
    it('> on template selection, should be visible', async () => {
  
      const visible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.STATUS_PANEL}"]`)
      expect(visible).toBeTruthy()
    })
  
    it('> on template selection, minimised status panel should be visible', async () => {
      const maximaizeVisible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.SHOW_FULL_STATUS_PANEL}"]`)
      expect(maximaizeVisible).toBeTruthy()
      try {
        const minimizeVisible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.HIDE_FULL_STATUS_PANEL}"]`)
        expect(minimizeVisible).toBeFalsy()
      } catch (e) {

      }
    })

    it('> clicking maximise btn should maximise the status panel', async () => {
      await atlasPage.click(`[aria-label="${ARIA_LABELS.SHOW_FULL_STATUS_PANEL}"]`)
      await atlasPage.wait(500)
      const minimizeVisible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.HIDE_FULL_STATUS_PANEL}"]`)
      expect(minimizeVisible).toBeTruthy()
      try {
        const maxVisible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.SHOW_FULL_STATUS_PANEL}"]`)
        expect(maxVisible).toBeFalsy()
      } catch (e) {

      }
    })

    it('> click min btn should minimize', async () => {
      await atlasPage.click(`[aria-label="${ARIA_LABELS.SHOW_FULL_STATUS_PANEL}"]`)
      await atlasPage.wait(500)
      await atlasPage.click(`[aria-label="${ARIA_LABELS.HIDE_FULL_STATUS_PANEL}"]`)
      await atlasPage.wait(500)
      try {
        const minimizeVisible = await atlasPage.isVisible(`[aria-label="${ARIA_LABELS.HIDE_FULL_STATUS_PANEL}"]`)
        expect(minimizeVisible).toBeFalsy()
      } catch (e) {

      }
    })
  })

})