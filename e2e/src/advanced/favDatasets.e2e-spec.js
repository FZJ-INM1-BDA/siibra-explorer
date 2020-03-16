const { AtlasPage } = require('../util')

const template = 'ICBM 2009c Nonlinear Asymmetric'
const area = 'Area hOc1 (V1, 17, CalcS)'

const receptorName = `Density measurements of different receptors for Area hOc1`
const pmapName = `Probabilistic cytoarchitectonic map of Area hOc1 (V1, 17, CalcS) (v2.4)`

// TODO finish writing tests
describe(`fav'ing dataset`, () => {
  let iavPage
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
    await iavPage.selectTitleCard(template)
    await iavPage.wait(500)
    await iavPage.waitUntilAllChunksLoaded()
  })

  afterEach(async () => {
    await iavPage.clearAlerts()
    await iavPage.wait(500)

    try {
      await iavPage.clearSearchRegionWithText()
      await iavPage.wait(500)
      await iavPage.clearAllSelectedRegions()
    }catch(e) {

    }

    try {
      await iavPage.showPinnedDatasetPanel()
      const textsArr = await iavPage.getPinnedDatasetsFromOpenedPanel()
      let length = textsArr.length
      while(length > 0){
        await iavPage.unpinNthDatasetFromOpenedPanel(0)
        length --
      }
    }catch(e){

    }

    await iavPage.wait(500)
  })

  it('> dataset can be fav ed from result panel', async () => {

    await iavPage.searchRegionWithText(area)
    await iavPage.wait(2000)
    await iavPage.selectSearchRegionAutocompleteWithText()
    await iavPage.dismissModal()
    await iavPage.searchRegionWithText('')

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

      await iavPage.searchRegionWithText(area)
      await iavPage.wait(2000)
      await iavPage.selectSearchRegionAutocompleteWithText()
      await iavPage.dismissModal()
      await iavPage.searchRegionWithText('')

      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      const probMap = datasets.indexOf(pmapName)

      await iavPage.togglePinNthDataset(receptorIndex)
      await iavPage.togglePinNthDataset(probMap)
    })

    it('> fav ed dataset is visible on UI', async () => {
      const number = await iavPage.getNumberOfFavDataset()
      expect(number).toEqual(2)
    })

    it('> clicking pin shows pinned datasets', async () => {
      await iavPage.showPinnedDatasetPanel()
      await iavPage.wait(500)
      const textsArr = await iavPage.getPinnedDatasetsFromOpenedPanel()
      
      expect(textsArr.length).toEqual(2)
      expect(textsArr).toContain(receptorName)
      expect(textsArr).toContain(pmapName)
    })

    it('> click unpin in fav data panel unpins, but also allow user to undo', async () => {
      await iavPage.showPinnedDatasetPanel()
      await iavPage.wait(1000)
      const textsArr = await iavPage.getPinnedDatasetsFromOpenedPanel()
      const idx = textsArr.indexOf(receptorName)
      if (idx < 0) throw new Error(`index of receptor name not found: ${receptorName}: ${textsArr}`)
      await iavPage.unpinNthDatasetFromOpenedPanel(idx)
      await iavPage.wait(500)
  
      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Unpinned dataset: ${receptorName}`)
  
      const number = await iavPage.getNumberOfFavDataset()
      expect(number).toEqual(1)

      await iavPage.clickSnackbarAction()
      await iavPage.wait(500)

      const textsArr3 = await iavPage.getPinnedDatasetsFromOpenedPanel()
      const number2 = await iavPage.getNumberOfFavDataset()
      expect(number2).toEqual(2)
      expect(
        textsArr3.indexOf(receptorName)
      ).toBeGreaterThanOrEqual(0)

    })

    // TODO effectively test the bulk dl button
    // it('> if fav dataset >=1, bulk dl btn is visible', async () => {

    // })
  })

  describe('> fav functionality in detailed dataset panel', () => {
    beforeEach(async () => {

      await iavPage.searchRegionWithText(area)
      await iavPage.wait(2000)
      await iavPage.selectSearchRegionAutocompleteWithText()
      await iavPage.dismissModal()
      await iavPage.searchRegionWithText('')


    })
    it('> click pin in dataset detail sheet pins fav, but also allows user to undo', async () => {
      
      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      await iavPage.clickNthDataset(receptorIndex)
      await iavPage.wait(500)
      await iavPage.clickModalBtnByText(/pin\ this\ dataset/i)
      await iavPage.wait(500)

      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Pinned dataset: ${receptorName}`)

      const number = await iavPage.getNumberOfFavDataset()
      expect(number).toEqual(1)

      await iavPage.clickSnackbarAction()
      await iavPage.wait(500)

      const number2 = await iavPage.getNumberOfFavDataset()
      expect(number2).toEqual(0)
    })

    it('click unpin in dataset detail sheet unpins fav, but also allows user to undo', async () => {

      const datasets = await iavPage.getVisibleDatasets()

      const receptorIndex = datasets.indexOf(receptorName)
      await iavPage.clickNthDataset(receptorIndex)
      await iavPage.wait(500)
      await iavPage.clickModalBtnByText(/pin\ this\ dataset/i)
      await iavPage.wait(500)

      const numberOfFav = await iavPage.getNumberOfFavDataset()
      expect(numberOfFav).toEqual(1)

      await iavPage.clickModalBtnByText(/unpin\ this\ dataset/i)
      await iavPage.wait(500)

      const txt = await iavPage.getSnackbarMessage()
      expect(txt).toEqual(`Unpinned dataset: ${receptorName}`)

      const numberOfFav1 = await iavPage.getNumberOfFavDataset()
      expect(numberOfFav1).toEqual(0)

      await iavPage.clickSnackbarAction()
      await iavPage.wait(500)


      const numberOfFav2 = await iavPage.getNumberOfFavDataset()
      expect(numberOfFav2).toEqual(1)
    })
  })
})
