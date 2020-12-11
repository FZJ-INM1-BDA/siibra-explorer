const { AtlasPage } = require('../util')
const { ARIA_LABELS, CONST } = require('../../../common/constants')
const { retry } = require('../../../common/util')

const atlasName = `Multilevel Human Atlas`

const templates = [
  'MNI Colin 27',
  'ICBM 152 2009c Nonlinear Asymmetric'
]

const area = 'Area hOc1 (V1, 17, CalcS)'

const receptorName = `Density measurements of different receptors for Area hOc1 (V1, 17, CalcS) [human, v1.0]`
const pmapName = `Probabilistic cytoarchitectonic map of Area hOc1 (V1, 17, CalcS) (v2.4)`

// TODO finish writing tests
describe(`fav'ing dataset`, () => {
  let iavPage = new AtlasPage()
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
    await iavPage.setAtlasSpecifications(atlasName, [ templates[1] ])

    // account for linear template translation backend
    await iavPage.wait(5000)
    await iavPage.waitUntilAllChunksLoaded()

    await iavPage.searchRegionWithText(area)
    await iavPage.wait(2000)
    await iavPage.selectSearchRegionAutocompleteWithText()
    await retry(async () => {
      await iavPage.dismissModal()
      await iavPage.toggleExpansionPanelState(`${CONST.REGIONAL_FEATURES}`, true)
    }, {
      timeout: 2000,
      retries: 10
    })

    await iavPage.wait(1000)
    await iavPage.waitUntilAllChunksLoaded()
    await iavPage.clearAlerts()
  })

  afterEach(async () => {
    /**
     * clear all fav'ed datasets
     */
    
     await iavPage.execScript(`window.localStorage.clear()`)
  })

  it('> dataset can be fav ed from result panel', async () => {

    const datasets = await iavPage.getVisibleDatasets()

    const receptorIndex = datasets.indexOf(receptorName)
    const probMap = datasets.indexOf(pmapName)
    expect(receptorIndex).toBeGreaterThanOrEqual(0)
    expect(probMap).toBeGreaterThanOrEqual(0)

    await iavPage.togglePinNthDataset(receptorIndex)
    await iavPage.wait(500)
    const txt = await iavPage.getSnackbarMessage()
    expect(txt).toEqual(`Pinned dataset: ${receptorName}`)
    
    await iavPage.togglePinNthDataset(probMap)
    await iavPage.wait(500)
    const txt2 = await iavPage.getSnackbarMessage()
    expect(txt2).toEqual(`Pinned dataset: ${pmapName}`)
  })

  describe('> fav dataset list', () => {
    beforeEach(async () => {

      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      const probMap = datasets.indexOf(pmapName)

      await iavPage.togglePinNthDataset(receptorIndex)
      await iavPage.togglePinNthDataset(probMap)
    })

    it('> fav ed dataset is visible on UI', async () => {
      const content = await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(content).toEqual('2')
    })

    it('> click unpin in fav data panel unpins, but also allow user to undo', async () => {
      await iavPage.showPinnedDatasetPanel()
      await iavPage.wait(1000)
      const textsArr = await iavPage.getBottomSheetList()
      const idx = textsArr.indexOf(receptorName)
      if (idx < 0) throw new Error(`index of receptor name not found: ${receptorName}: ${textsArr}`)
      await iavPage.clickNthItemFromBottomSheetList(idx, `[aria-label="Toggle pinning this dataset"]`)
      await iavPage.wait(500)
  
      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Unpinned dataset: ${receptorName}`)
  
      const content = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(content).toEqual('1')

      await iavPage.clickSnackbarAction()
      await iavPage.wait(500)

      const textsArr3 = await iavPage.getBottomSheetList()
      const content2 = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(content2).toEqual('2')
      expect(
        textsArr3.indexOf(receptorName)
      ).toBeGreaterThanOrEqual(0)

    })

    // TODO effectively test the bulk dl button
    // it('> if fav dataset >=1, bulk dl btn is visible', async () => {

    // })
  })

  describe('> fav functionality in detailed dataset panel', () => {

    it('> click pin in dataset detail sheet pins fav, but also allows user to undo', async () => {
      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      await iavPage.clickNthDataset(receptorIndex)
      await iavPage.wait(500)

      // specificity is required, because single dataset card for julich brain also can be selected, and will be clicked and fail this test
      await iavPage.click(`[aria-label="${ARIA_LABELS.PIN_DATASET}"]`)
      await iavPage.wait(500)

      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Pinned dataset: ${receptorName}`)

      const content = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(content).toEqual('1')

      await iavPage.clickSnackbarAction()
      await iavPage.wait(500)

      const text = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(text).toBeFalsy()
    })

    it('> click unpin in dataset detail sheet unpins fav, but also allows user to undo', async () => {

      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      await iavPage.clickNthDataset(receptorIndex)
      await iavPage.wait(500)

      // specificity is required, because single dataset card for julich brain also can be selected, and will be clicked and fail this test
      await iavPage.click(`[aria-label="${ARIA_LABELS.PIN_DATASET}"]`)
      await iavPage.wait(500)

      const numberOfFav = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(numberOfFav).toEqual('1')
      
      // this wait is unfortunately necessary, as the snack bar sometimes obscures the unpin this dataset button	
      await iavPage.wait(5000)

      // specificity is required, because single dataset card for julich brain also can be selected, and will be clicked and fail this test
      await iavPage.click(`[aria-label="${ARIA_LABELS.PIN_DATASET}"]`)
      await iavPage.wait(500)

      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Unpinned dataset: ${receptorName}`)

      const text = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(text).toBeFalsy()
      
      await iavPage.clickSnackbarAction()
      await iavPage.wait(500)

      const numberOfFav2 = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(numberOfFav2).toEqual('1')
    })
  
  })

  describe('> access via collection', () => {
    beforeEach(async () => {

      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      const probMap = datasets.indexOf(pmapName)

      await iavPage.togglePinNthDataset(receptorIndex)
      await iavPage.togglePinNthDataset(probMap)
    })

    it('> clicking pin shows collection of pinned datasets', async () => {

      await iavPage.showPinnedDatasetPanel()
      await iavPage.wait(500)
      const textsArr = await iavPage.getBottomSheetList()
      
      expect(textsArr.length).toEqual(2)
      expect(textsArr).toContain(receptorName)
      expect(textsArr).toContain(pmapName)
    })

    it('> dataset detail can be launched via collection', async () => {
      await iavPage.showPinnedDatasetPanel()
      const textsArr = await iavPage.getBottomSheetList()
      const idx = textsArr.findIndex(t => t === receptorName)
      expect(idx).toBeGreaterThanOrEqual(0)
      await iavPage.clickNthItemFromBottomSheetList(idx)
      await iavPage.wait(1000)
      const modalText = await iavPage.getModalText()
      expect(modalText.length).toBeGreaterThan(1e3)
    })

    it('> dataset can be pinned/unpinned via collection', async () => {
      await iavPage.showPinnedDatasetPanel()
      const textsArr = await iavPage.getBottomSheetList()
      const idx = textsArr.findIndex(t => t === receptorName)
      await iavPage.clickNthItemFromBottomSheetList(idx)
      await iavPage.wait(1000)

      /**
       * for now, from collection, a modal is launched
       */
      await iavPage.click(`mat-dialog-container [aria-label="${ARIA_LABELS.PIN_DATASET}"]`)
      await iavPage.wait(1000)
      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Unpinned dataset: ${receptorName}`)

      const content = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(content).toEqual('1')

      await iavPage.wait(5000)

      await iavPage.click(`mat-dialog-container [aria-label="${ARIA_LABELS.PIN_DATASET}"]`)
      await iavPage.wait(1000)
      const txt2 = await iavPage.getSnackbarMessage()
      expect(txt2).toEqual(`Pinned dataset: ${receptorName}`)

      const content2 = await await iavPage.getBadgeContentByDesc(CONST.PINNED_DATASETS_BADGE_DESC)
      expect(content2).toEqual('2')

    })
  })
})
