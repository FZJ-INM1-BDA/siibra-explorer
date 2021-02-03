const { isatty } = require("tty")
const { AtlasPage } = require("../util")

const atlasName = 'Multilevel Human Atlas'
const tNameIcbm152 = 'ICBM 152 2009c Nonlinear Asymmetric'
const tNameColin = 'MNI Colin 27'
const tNameBB = 'Big Brain (Histology)'

describe('templates > ', () => {

  let iavPage
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  describe('selecting template', () => {
    
    it('can select template by clicking main card', async () => {
      await iavPage.goto()
      await iavPage.setAtlasSpecifications(atlasName)
      await iavPage.wait(1000)
  
      const viewerIsPopulated = await iavPage.viewerIsPopulated()
      expect(viewerIsPopulated).toBe(true)
    })
    
  
    it('switching template after template init by clicking select should work', async () => {
  
      await iavPage.goto()
  
      await iavPage.setAtlasSpecifications(atlasName, [ tNameIcbm152 ])
      await iavPage.wait(1000)
  
      await iavPage.setAtlasSpecifications(atlasName, [ tNameBB ])
      await iavPage.wait(7000)
  
      const viewerIsPopulated = await iavPage.viewerIsPopulated()
      expect(viewerIsPopulated).toBe(true)
    })
  
    it('MNI152 should return desc', async () => {
  
      const expectedDesc = `An unbiased non-linear average of multiple subjects from the MNI152 database, which provides high-spatial resolution and signal-to-noise while not being biased towards a single brain (Fonov et al., 2011). This template space is widely used as a reference space in neuroimaging. HBP provides the JuBrain probabilistic cytoarchitectonic atlas (Amunts/Zilles, 2015) as well as a probabilistic atlas of large fibre bundles (Guevara, Mangin et al., 2017) in this space.`
  
      await iavPage.goto()
  
      await iavPage.setAtlasSpecifications(atlasName, [ tNameIcbm152 ])
      await iavPage.wait(1000)
  
      const info = await iavPage.getAtlasTileInfo(tNameIcbm152)
  
      expect(
        info.indexOf(expectedDesc)
      ).toBeGreaterThanOrEqual(0)
    })
  })
  
  describe('> switching template', () => {
    beforeEach(async () => {

      await iavPage.goto()
      await iavPage.setAtlasSpecifications(atlasName, [ tNameIcbm152 ])
      await iavPage.wait(500)
      await iavPage.waitUntilAllChunksLoaded()
    })
    it('> activeFlag works', async () => {
      const isActive = await iavPage.atlasTileIsActive(tNameIcbm152)
      expect(isActive.toString()).toEqual('true')
      const isNotActive = await iavPage.atlasTileIsActive(tNameColin)
      expect(isNotActive.toString()).toEqual('false')

    })
    it('> works in regular navigation', async () => {

      await iavPage.setAtlasSpecifications(atlasName, [ tNameColin ])
      await iavPage.wait(500)
      await iavPage.waitUntilAllChunksLoaded()
      await iavPage.wait(500)
      
      const isActive = await iavPage.atlasTileIsActive(tNameColin)
      expect(isActive.toString()).toEqual('true')

      const isNotActive = await iavPage.atlasTileIsActive(tNameIcbm152)
      expect(isNotActive.toString()).toEqual('false')

    })

    it('> works in history navigation', async () => {

      await iavPage.setAtlasSpecifications(atlasName, [ tNameColin ])
      await iavPage.wait(500)
      await iavPage.waitUntilAllChunksLoaded()
      
      await iavPage.historyBack()
      await iavPage.wait(500)
      await iavPage.waitForAsync()

      const isActive = await iavPage.atlasTileIsActive(tNameIcbm152)
      expect(isActive.toString()).toEqual('true')
      const isNotActive = await iavPage.atlasTileIsActive(tNameColin)
      expect(isNotActive.toString()).toEqual('false')
    })
  })

})