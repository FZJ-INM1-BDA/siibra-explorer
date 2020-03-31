const {AtlasPage} = require('../util')

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
  {
    url: "/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..1n5q~.1FYC.2Is-..1B9C",
    templateName: 'Big Brain (Histology)',
    position: [691,678], // [370, 150],
    expectedRegion: 'Area STS1 (STS)',
    expectedTemplateLabels: [
      {
        name: 'MNI Colin 27',
        hemisphere: 'Left',
        expectedPosition: [-54514755, -16753913, -5260713]
      },
      {
        name: 'MNI Colin 27',
        hemisphere: 'Right',
        expectedPosition: [54536567, -17992636, -5712544]
      },
      {
        name: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
        hemisphere: 'Left',
        expectedPosition: [-55442669, -18314601, -6381831]
      },
      {
        name: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
        hemisphere: 'Right',
        expectedPosition: [52602966, -18339402, -5666868]
      },
    ],
  },
]


describe('explore same region in different templates', () => {

  let iavPage
  beforeAll(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  TEST_DATA.forEach(template => {
    template.expectedTemplateLabels.forEach(expectedTemplate => {
      it (`testing ${template.expectedRegion} exploring at: ${template.name}`, async () => {
        if (template.url) {
          await iavPage.goto(template.url)
        } else {
          await iavPage.goto()
          await iavPage.selectTitleTemplateParcellation(template.name)
        }
        const {position} = template

        const tag = await iavPage.getSideNavTag()
        await tag.click()
        await iavPage.wait(1000)
        await iavPage.waitUntilAllChunksLoaded()
        await iavPage.cursorMoveToAndClick({ position })

        await iavPage.showOtherTemplateMenu()
        await iavPage.wait(500)

        const otherTemplates = await iavPage.getAllOtherTemplates()
        const { name, hemisphere, expectedPosition } = expectedTemplate
        const idx = otherTemplates.findIndex(template => {
          if (hemisphere) {
            if (template.indexOf(hemisphere) < 0) return false
          }
          return template.indexOf(name) >= 0
        })

        expect(idx).toBeGreaterThanOrEqual(0)

        await iavPage.clickNthItemAllOtherTemplates(idx)

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
  })
})
