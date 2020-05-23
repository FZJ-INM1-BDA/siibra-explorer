const { AtlasPage } = require("../util")

describe('templates > ', () => {

  let iavPage
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  describe('selecting template', () => {
    
    it('can select template by clicking main card', async () => {
      await iavPage.goto()
      await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
      await iavPage.wait(1000)
  
      const viewerIsPopulated = await iavPage.viewerIsPopulated()
      expect(viewerIsPopulated).toBe(true)
    })
    
  
    it('switching template after template init by clicking select should work', async () => {
  
      await iavPage.goto()
  
      await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
      await iavPage.wait(1000)
  
      await iavPage.selectDropdownTemplate('Big Brain (Histology)')
      await iavPage.wait(7000)
  
      const viewerIsPopulated = await iavPage.viewerIsPopulated()
      expect(viewerIsPopulated).toBe(true)
    })
  
    it('MNI152 should return desc', async () => {
  
      const expectedDesc = `An unbiased non-linear average of multiple subjects from the MNI152 database, which provides high-spatial resolution and signal-to-noise while not being biased towards a single brain (Fonov et al., 2011). This template space is widely used as a reference space in neuroimaging. HBP provides the JuBrain probabilistic cytoarchitectonic atlas (Amunts/Zilles, 2015) as well as a probabilistic atlas of large fibre bundles (Guevara, Mangin et al., 2017) in this space.`
  
      await iavPage.goto()
  
      await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
      await iavPage.wait(1000)
  
      const info = await iavPage.getTemplateInfo()
  
      expect(
        info.indexOf(expectedDesc)
      ).toBeGreaterThanOrEqual(0)
    })
  })
  
  describe('switching template > ', () => {
    it('works in history navigation', async () => {
      await iavPage.goto()
      await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
      await iavPage.wait(500)
      await iavPage.waitUntilAllChunksLoaded()

      await iavPage.selectDropdownTemplate('MNI Colin 27')
      await iavPage.wait(500)
      await iavPage.waitUntilAllChunksLoaded()

      await iavPage.historyBack()
      await iavPage.wait(500)
      await iavPage.historyBack()
      await iavPage.wait(2000)

      const visible = await iavPage.sideNavIsVisible()
      if (!visible) await iavPage.clickSideNavTab()
      const templateInfo = await iavPage.getTemplateInfo()

      expect(
        templateInfo.indexOf('ICBM 2009c Nonlinear Asymmetric')
      ).toBeGreaterThanOrEqual(0)
    })
  })
})