const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
const { SHOW_IN_OTHER_REF_SPACE, AVAILABILITY_IN_OTHER_REF_SPACE } = ARIA_LABELS

const TEST_DATA = [
  {
    url: "/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas",
    templateName: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
    position: [450, 200],
    expectedRegion: 'Area hOc1 (V1, 17, CalcS) - left hemisphere',
    expectedTemplateLabels: [
      {
        name: 'Big Brain (Histology)',
        expectedPosition: [3187941, -50436480, 3430986]
      },
      {
        name: 'MNI Colin 27',
        expectedPosition: [
          -8533787,
          -84646549,
          1855106
        ]
      },
    ],
  },
  // {
  //   url: "/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..1n5q~.1FYC.2Is-..1B9C",
  //   templateName: 'Big Brain (Histology)',
  //   position: [691,678], // [370, 150],
  //   expectedRegion: 'Area STS1 (STS)',
  //   expectedTemplateLabels: [
  //     {
  //       name: 'MNI Colin 27',
  //       hemisphere: 'Left',
  //       expectedPosition: [-54514755, -16753913, -5260713]
  //     },
  //     {
  //       name: 'MNI Colin 27',
  //       hemisphere: 'Right',
  //       expectedPosition: [54536567, -17992636, -5712544]
  //     },
  //     {
  //       name: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
  //       hemisphere: 'Left',
  //       expectedPosition: [-55442669, -18314601, -6381831]
  //     },
  //     {
  //       name: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
  //       hemisphere: 'Right',
  //       expectedPosition: [52602966, -18339402, -5666868]
  //     },
  //   ],
  // },
]

const getBeforeEachFn = iavPage => ({ 
  url,
  templateName,
  position,
 }) => async () => {

  if (url) {
    await iavPage.goto(url)
  } else {
    await iavPage.goto()
    await iavPage.selectTitleTemplateParcellation(templateName)
    await iavPage.wait(500)
    await iavPage.waitForAsync()
  }

  const tag = await iavPage.getSideNavTag()
  await tag.click()
  await iavPage.wait(1000)
  await iavPage.waitUntilAllChunksLoaded()
  await iavPage.cursorMoveToAndClick({ position })

  await iavPage.click(`[aria-label="${SHOW_IN_OTHER_REF_SPACE}"]`)
  await iavPage.wait(500)
}

describe('> explore same region in different templates', () => {

  let iavPage
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  describe('> moving to different reference template works', () => {
    for (const template of TEST_DATA) {
      const { 
        url,
        templateName,
        position,
        expectedRegion,
        expectedTemplateLabels,
       } = template

      describe(`> testing ${templateName}`, () => {
        beforeEach(async () => {
          await getBeforeEachFn(iavPage)(template)()
        })

        for (const tmplLabel of expectedTemplateLabels) {
          const { expectedPosition, name, hemisphere } = tmplLabel
          describe(`> moving to ${name}`, () => {
            it('> works as expected', async () => {

              const otherTemplates = await iavPage.getText(`[aria-label="${SHOW_IN_OTHER_REF_SPACE}: ${name}${hemisphere ? (' - ' + hemisphere) : ''}"]`)
              if (hemisphere) {
                expect(otherTemplates.indexOf(hemisphere)).toBeGreaterThanOrEqual(0)
              }
              expect(otherTemplates.indexOf(name)).toBeGreaterThanOrEqual(0)
      
              await iavPage.click(`[aria-label="${SHOW_IN_OTHER_REF_SPACE}: ${name}${hemisphere ? (' - ' + hemisphere) : ''}"]`)
              await iavPage.wait(500)
              await iavPage.waitUntilAllChunksLoaded()
              
              const navState = await iavPage.getNavigationState()
      
              // somehow there are slight deviations (1nm in most cases)
              // giving a tolerance of 0.1um
              for (const idx in navState.position) {
                expect(
                  Math.abs(navState.position[idx] - expectedPosition[idx])
                ).toBeLessThanOrEqual(100)
              }
            })
          })
        }
      })
    }
  })

  describe('> menu UI', () => {
    const data = TEST_DATA[0]
    
    beforeEach(async () => {
      await getBeforeEachFn(iavPage)(data)()
    })

    it('> dismisses when user clicks/drags outside', async () => {
      const { expectedRegion, expectedTemplateLabels, position, url, templateName } = data

      await iavPage.cursorMoveToAndDrag({
        position: [position[0], position[1] - 100],
        delta: [50, 1]
      })

      await iavPage.wait(1000)

      // should throw
      try {
        const otherTemplates = await iavPage.getAllOtherTemplates()
        expect(true).toBe(false)
      } catch(e) {
        expect(true).toBe(true)
      }
    })
  })
})
