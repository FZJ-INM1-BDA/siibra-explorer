const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
const dict = {
  "ICBM 2009c Nonlinear Asymmetric": {
    "JuBrain Cytoarchitectonic Atlas": {
      tests:[
        {
          position: [550, 270],
          expectedLabelName: 'Fastigial Nucleus (Cerebellum) - right hemisphere',
        }
      ]
    }
  }
}

describe('> viewerCtxMenu', () => {

  for (const templateName in dict) {
    for (const parcellationName in dict[templateName]) {
      describe(`> on ${templateName} / ${parcellationName}`, () => {
        beforeAll(async () => {
          iavPage = new AtlasPage()
          await iavPage.init()
          await iavPage.goto()
          await iavPage.selectTitleTemplateParcellation(templateName, parcellationName)
          await iavPage.wait(500)
          await iavPage.waitForAsync()
        })

        it('> does not appear on init', async () => {
          const visible = await iavPage.isVisible(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
          expect(visible).toBeFalse()
        })
  
        it('> appears on click', async () => {
          const { tests } = dict[templateName][parcellationName]
          const { position } = tests[0]
          await iavPage.cursorMoveToAndClick({ position })
          await iavPage.wait(500)
          const visible = await iavPage.isVisible(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
          expect(visible).toBeTrue()
        })

        it('> disappear again on click of anywhere else', async () => {
          await iavPage.cursorMoveToAndClick({ position: [10, 10] })
          await iavPage.wait(500)
          const visible = await iavPage.isVisible(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
          expect(visible).toBeFalse()
        })
      })
    }
  }
})