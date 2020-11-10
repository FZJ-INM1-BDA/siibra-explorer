const { AtlasPage } = require('../../util/helper')

const atlases = [
  'Waxholm Space atlas of the Sprague Dawley rat brain',
  'Multilevel Human Atlas',
  'Allen Mouse Common Coordinate Framework v3'
]

describe('> atlases are generally available', () => {
  let atlasPage = new AtlasPage()
  beforeEach(async () => {
    atlasPage = new AtlasPage()
    await atlasPage.init()
  })
  it('> on startup, there should be three atlases', async () => {
    await atlasPage.goto()
    const texts = await atlasPage.getAllCardsText()
    expect(texts.sort()).toEqual(atlases.sort())
  })
})

describe('> generic atlas behaviours', () => {
  let atlasPage = new AtlasPage()
  beforeEach(async () => {
    atlasPage = new AtlasPage()
    await atlasPage.init()
  })
  for (const atlas of atlases) {
    describe(`> of ${atlas}`, () => {
      it('> on launch, shows atlas name as a pill', async () => {
        await atlasPage.goto()
        await atlasPage.clearAlerts()
        await atlasPage.setAtlasSpecifications(atlas)
        await atlasPage.wait(500)
        await atlasPage.waitUntilAllChunksLoaded()
        const txtArr = await atlasPage.getAllChipsText()
        expect(
          txtArr.filter(v => v.replace(/\s/g, '').length > 0).length
        ).toBeGreaterThan(0)
        console.log(`chip shows: ${txtArr.join(', ')}`)
      })
    })
  }
})

describe('> in human multi level', () => {
  let atlasPage = new AtlasPage()
  beforeAll(async () => {
    atlasPage = new AtlasPage()
    await atlasPage.init()
    await atlasPage.goto()
    await atlasPage.clearAlerts()
  })
  describe('> removal of additional layers should restore base layer', () => {
    it('> in mni152', async () => {
      await atlasPage.setAtlasSpecifications(atlases[1], [`Fibre tracts`, `Short Bundle`])
      await atlasPage.wait(500)
      await atlasPage.waitForAsync()

      const txtArr = await atlasPage.getAllChipsText()
      expect(
        txtArr.find(txt => /short bundle/i.test(txt))
      ).toBeTruthy()

      await atlasPage.clickChip(/short bundle/i, '.fa-times')

      const txtArr2 = await atlasPage.getAllChipsText()
      expect(
        txtArr2.find(txt => /short bundle/i.test(txt))
      ).toBeFalsy()
      
    })

    it('> in bigbrain', async () => {
      await atlasPage.setAtlasSpecifications(atlases[1], [/isocortex/i])
      await atlasPage.wait(500)
      await atlasPage.waitForAsync()

      const txtArr = await atlasPage.getAllChipsText()
      expect(
        txtArr.find(txt => /isocortex/i.test(txt))
      ).toBeTruthy()

      await atlasPage.clickChip(/isocortex/i, '.fa-times')

      const txtArr2 = await atlasPage.getAllChipsText()
      expect(
        txtArr2.find(txt => /isocortex/i.test(txt))
      ).toBeFalsy()
      
    })
  })
})
