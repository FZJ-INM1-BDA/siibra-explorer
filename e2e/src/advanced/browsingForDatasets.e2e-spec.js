const { AtlasPage } = require('../util')

const templates = [
  'MNI Colin 27',
  'ICBM 2009c Nonlinear Asymmetric'
]

const areasShouldHaveRecptor = [
  'Area 7A (SPL)',
  'Area 3b (PostCG)',
  'Area PFm (IPL)',
  'Area PFop (IPL)',
  'Area PF (IPL)',
  'Area PGp (IPL)',
  'Area PGa (IPL)',
  'Area PFt (IPL)',
  'Area PFcm (IPL)',
  'Area hOc1 (V1, 17, CalcS)',
  'Area 44 (IFG)',
  'Area 45 (IFG)',
  'Area 4p (PreCG)',
  'Area TE 1.0 (HESCHL)',
  'Area FG1 (FusG)',
  'Area FG2 (FusG)'
]

describe('dataset browser', () => {
  let iavPage
  beforeAll(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  for (const template of templates) {
    describe(`in template: ${template}`, () => {
      beforeAll(async () => {
        await iavPage.goto()
        await iavPage.selectTitleCard(template)
        await iavPage.wait(500)
        await iavPage.waitUntilAllChunksLoaded()
      })

      afterEach(async () => {
        await iavPage.clearSearchRegionWithText()
        await iavPage.clearAllSelectedRegions()
      })
      for (const area of areasShouldHaveRecptor) {
        it(`receptor data ${area} should be able to be found`, async () => {
          await iavPage.searchRegionWithText(area)
          await iavPage.wait(2000)
          await iavPage.selectSearchRegionAutocompleteWithText()
          await iavPage.dismissModal()
          await iavPage.searchRegionWithText('')

          const datasets = await iavPage.getVisibleDatasets()
          const filteredDs = datasets.filter(ds => ds.toLowerCase().indexOf('receptor') >= 0)
          expect(filteredDs.length).toBeGreaterThan(0)
          //TODO
        })
      }
    })
  }
})