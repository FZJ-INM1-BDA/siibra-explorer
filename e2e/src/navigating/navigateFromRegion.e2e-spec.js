const {AtlasPage} = require('../util')

const TEST_DATA = [
  {
    url: "/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas",
    templateName: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
    position: [600, 490],
    expectedRegion: 'Area 6ma (preSMA, mesial SFG) - left hemisphere',
    expectedTemplateLabels: [
      {
        buttonText: 'Big Brain (Histology)',
        expectedPosition: [-9349145, 27783956, 38734628]
      },
      {
        buttonText: 'MNI Colin 27',
        afterSelectNavigation: [-4083913, 4296092, 58555023]
      },
    ],
  },
  {
    url: "/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cNavigation=0.0.0.-W000.._eCwg.2-FUe3._-s_W.2_evlu..7LIx..1n5q~.1FYC.2Is-..1B9C",
    templateName: 'Big Brain (Histology)',
    position: [370, 150],
    expectedRegion: 'Area STS1 (STS)',
    expectedTemplateLabels: [
      {
        buttonText: 'MNI Colin 27',
        hemisphere:'Left',
        afterSelectNavigation: [-54514755, -16753913, -5260713]
      },
      {
        buttonText: 'MNI Colin 27 - Right',
        afterSelectNavigation: [54536567, -17992636, -5712544]
      },
      {
        buttonText: 'MNI 152 ICBM 2009c Nonlinear Asymmetric - Left',
        afterSelectNavigation: [-55442669, -18314601, -6381831]
      },
      {
        buttonText: 'MNI 152 ICBM 2009c Nonlinear Asymmetric - Right',
        afterSelectNavigation: [52602966, -18339402, -5666868]
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
      it (`testing ${template.expectedRegion} exploring at: ${template.templateName}`, async () => {
        if (template.url) {
          await iavPage.goto(template.url)
        } else {
          await iavPage.goto()
          await iavPage.selectTitleTemplateParcellation(template.templateName)
        }
        const {position} = template

        const tag = await iavPage.getSideNavTag()
        await tag.click()
        await iavPage.wait(1000)
        await iavPage.waitUntilAllChunksLoaded()
        await iavPage.showRegionMenu( {position} )
        await iavPage.wait(5000)
        await iavPage.wait(5000)
        await iavPage.wait(5000)

        await iavPage.changeTemplateFromRegionMenu(expectedTemplate.buttonText, expectedTemplate.hemisphere && expectedTemplate.hemisphere)

        await iavPage.wait(1000)
        await iavPage.waitUntilAllChunksLoaded()

        const navState = await iavPage.getNavigationState()

        expect(navState.position).toEqual(expectedTemplate.expectedPosition)

      })
    })

  })

})
