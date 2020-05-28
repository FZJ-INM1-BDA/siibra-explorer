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
  },
  "Big Brain (Histology)": {
    "Cytoarchitectonic Maps": {
      tests:[
        {
          position: [440,200],
          expectedLabelName: 'Area hOc1 (V1, 17, CalcS)',
          expectedLabelStatus: '(fully mapped)'
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

        it('> Title includes region status', async () => {
          const { tests } = dict[templateName][parcellationName]
          const { expectedLabelStatus, expectedLabelName } = tests[0]
          await iavPage.wait(500)
          if (expectedLabelStatus) {
            const fullMenuText = await iavPage.getText(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
            if (fullMenuText.includes(`${expectedLabelName} ${expectedLabelStatus}`)) {
              expect(true).toBe(true)
            } else {
              expect(true).toBe(false)
            }
          }
        })

        it('> Title do not includes region status', async () => {
          const { tests } = dict[templateName][parcellationName]
          const { expectedLabelStatus, expectedLabelName } = tests[0]
          await iavPage.wait(500)
          if (!expectedLabelStatus) {
            const fullMenuText = await iavPage.getText(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
            if (fullMenuText.includes(expectedLabelName)) {
              expect(true).toBe(true)
            } else {
              expect(true).toBe(false)
            }
          }
        })

        it('> pos does not change when click inside', async () => {
          const { x: xBefore, y: yBefore, height: hBefore } = await iavPage.isAt(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
          await iavPage.click(`[aria-label="${ARIA_LABELS.SHOW_IN_OTHER_REF_SPACE}"]`)
          await iavPage.wait(500)
          const { x: xAfter, y: yAfter, height: hAfter } = await iavPage.isAt(`[aria-label="${ARIA_LABELS.CONTEXT_MENU}"]`)
          expect(xBefore).toEqual(xAfter)
          expect(yBefore).toEqual(yAfter)
          expect(hAfter).toBeGreaterThan(hBefore)
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