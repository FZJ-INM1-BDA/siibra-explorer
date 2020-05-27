const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
const { TOGGLE_EXPLORE_PANEL, MODALITY_FILTER } = ARIA_LABELS

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

describe('> dataset browser', () => {
  let iavPage
  beforeAll(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  for (const template of templates) {
    describe(`> in template: ${template}`, () => {
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
        it(`> receptor data ${area} should be able to be found`, async () => {
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

const template = 'ICBM 2009c Nonlinear Asymmetric'
const area = 'Area hOc1 (V1, 17, CalcS)'

const receptorName = `Density measurements of different receptors for Area hOc1 (V1, 17, CalcS) [human, v1.0]`

describe('> dataset previews', () => {
  let iavPage
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
    await iavPage.selectTitleCard(template)
    await iavPage.wait(500)
    await iavPage.waitUntilAllChunksLoaded()

    await iavPage.searchRegionWithText(area)
    await iavPage.wait(2000)
    await iavPage.selectSearchRegionAutocompleteWithText()
    await iavPage.dismissModal()
    await iavPage.searchRegionWithText('')

    const datasets = await iavPage.getVisibleDatasets()
    const receptorIndex = datasets.indexOf(receptorName)

    await iavPage.clickNthDataset(receptorIndex)
    await iavPage.waitFor(true, true)
    await iavPage.clickModalBtnByText(/preview/i)
    await iavPage.waitFor(true, true)
  })

  describe('> can display graph', () => {

    it('> can display radar graph', async () => {
      const files = await iavPage.getBottomSheetList()
      const fingerprintIndex = files.findIndex(file => /fingerprint/i.test(file))
      await iavPage.clickNthItemFromBottomSheetList(fingerprintIndex)
      await iavPage.waitFor(true, true)
      const modalHasCanvas = await iavPage.modalHasChild('canvas')
      expect(modalHasCanvas).toEqual(true)
    })

    it('> can display profile', async () => {

      const files = await iavPage.getBottomSheetList()
      const profileIndex = files.findIndex(file => /profile/i.test(file))
      await iavPage.clickNthItemFromBottomSheetList(profileIndex)
      await iavPage.waitFor(true, true)
      const modalHasCanvas = await iavPage.modalHasChild('canvas')
      expect(modalHasCanvas).toEqual(true)
    })
  })
  it('> can display image', async () => {
    const files = await iavPage.getBottomSheetList()
    const imageIndex = files.findIndex(file => /image\//i.test(file))
    await iavPage.clickNthItemFromBottomSheetList(imageIndex)
    await iavPage.waitFor(true, true)
    const modalHasImage = await iavPage.modalHasChild('div[data-img-src]')
    expect(modalHasImage).toEqual(true)
  })
})

describe('> modality picker', () => {
  let iavPage
  beforeAll(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
  })
  it('> sorted alphabetically', async () => {
    await iavPage.selectTitleCard(templates[1])
    await iavPage.wait(500)
    await iavPage.waitUntilAllChunksLoaded()
    await iavPage.click(`[aria-label="${TOGGLE_EXPLORE_PANEL}"]`)
    await iavPage.wait(500)
    await iavPage.clearAlerts()
    await iavPage.click(`[aria-label="${MODALITY_FILTER}"]`)
    await iavPage.wait(500)
    const modalities = await iavPage.getModalities()
    for (let i = 1; i < modalities.length; i ++) {
      expect(
        modalities[i].charCodeAt(0)
      ).toBeGreaterThanOrEqual(
        modalities[i - 1].charCodeAt(0)
      )
    }
  })
})
