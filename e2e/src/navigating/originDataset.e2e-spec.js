const { AtlasPage } = require("../util")
const { ARIA_LABELS } = require('../../../common/constants')
const { SHOW_CONNECTIVITY_DATA, SHOW_IN_OTHER_REF_SPACE, SHOW_ORIGIN_DATASET } = ARIA_LABELS

const cssSelector = `[aria-label="${SHOW_ORIGIN_DATASET}"]`

const dict = {
  'ICBM 2009c Nonlinear Asymmetric': {
    'JuBrain Cytoarchitectonic Atlas': {
      tests: [
        {
          position: [600, 490],
          expectedLabelName: 'Area 6ma (preSMA, mesial SFG) - left hemisphere',
        }
      ]
    }
  }
}

describe('origin dataset pmap', () => {
  let iavPage

  beforeAll(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  for (const templateName in dict) {
    for (const parcellationName in dict[templateName]) {
      describe(`testing template: ${templateName}, parcellation name: ${parcellationName}`, () => {

        const {url, tests} = dict[templateName][parcellationName]
        beforeAll(async () => {
          if (url) {
            await iavPage.goto(url)
          } else {
            await iavPage.goto()
            await iavPage.selectTitleTemplateParcellation(templateName, parcellationName)
          }
          
          const tag = await iavPage.getSideNavTag()
          await tag.click()
          await iavPage.wait(5000)
          await iavPage.waitUntilAllChunksLoaded()
        })

        for (const test of tests) {
          it('> original pmap btn exists, and on click, show pmap', async () => {

            const { position, expectedLabelName } = test
            await iavPage.cursorMoveToAndClick({ position })

            await iavPage.click(cssSelector)
            await iavPage.wait(5000)
            await iavPage.waitForAsync()

            const additionalLayerControlIsShown = await iavPage.additionalLayerControlIsVisible()
            expect(additionalLayerControlIsShown).toEqual(true)
            
            const checked = await iavPage.switchIsChecked(cssSelector)
            expect(checked).toEqual(true)
          })

          it('> on second click, dismisses the pmap', async () => {

            await iavPage.click(cssSelector)
            await iavPage.wait(5000)
            await iavPage.waitForAsync()

            const additionalLayerControlIsShown = await iavPage.additionalLayerControlIsVisible()
            expect(additionalLayerControlIsShown).toEqual(false)
            
            const checked = await iavPage.switchIsChecked(cssSelector)
            expect(checked).toEqual(false)
          })
        }
      })
    }
  }
})