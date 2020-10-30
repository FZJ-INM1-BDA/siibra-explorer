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

describe('> generic atlaes behaviours', () => {
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
        await atlasPage.selectAtlasTemplateParcellation(atlas)
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