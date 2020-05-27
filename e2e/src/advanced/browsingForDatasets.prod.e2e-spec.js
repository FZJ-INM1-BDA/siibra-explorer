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

describe('> receptor dataset previews', () => {
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

describe('> pmap dataset preview', () => {
  let iavPage

  beforeAll(async () => {
    // loads pmap and centers on hot spot
    const url = `/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&cNavigation=0.0.0.-W000..2_ZG29.-ASCS.2-8jM2._aAY3..BSR0..dABI~.525x0~.7iMV..1EPC&niftiLayers=https%3A%2F%2Fneuroglancer.humanbrainproject.eu%2Fprecomputed%2FJuBrain%2F17%2Ficbm152casym%2Fpmaps%2FVisual_hOc1_l_N10_nlin2MNI152ASYM2009C_2.4_publicP_d3045ee3c0c4de9820eb1516d2cc72bb.nii.gz&previewingDatasetFiles=%5B%7B"datasetId"%3A"minds%2Fcore%2Fdataset%2Fv1.0.0%2F5c669b77-c981-424a-858d-fe9f527dbc07"%2C"filename"%3A"Area+hOc1+%28V1%2C+17%2C+CalcS%29+%5Bv2.4%2C+ICBM+2009c+Asymmetric%2C+left+hemisphere%5D"%7D%5D`
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto(url)
    await iavPage.waitUntilAllChunksLoaded()
  })

  it('> can display pmap', async () => {
    const { red, green, blue } = await iavPage.getRgbAt({position: [200, 597]})
    expect(red).toBeGreaterThan(green)
    expect(red).toBeGreaterThan(blue)
  })

  it('> on update of layer control, pmap retains', async () => {
    // by default, additional layer control is collapsed
    await iavPage.toggleLayerControl()
    await iavPage.wait(500)
    await iavPage.toggleNthLayerControl(0)
    await iavPage.wait(5500)

    // interact with control
    await iavPage.click(`[aria-label="Remove background"]`)
    await iavPage.wait(500)

    // color map should be unchanged
    const { red, green, blue } = await iavPage.getRgbAt({position: [200, 597]})
    expect(red).toBeGreaterThan(green)
    expect(red).toBeGreaterThan(blue)
    
  })
})
