const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
const { retry } = require('../../../common/util')
const { TOGGLE_EXPLORE_PANEL, MODALITY_FILTER, DOWNLOAD_PREVIEW, DOWNLOAD_PREVIEW_CSV } = ARIA_LABELS

const atlasName = `Multilevel Human Atlas`

const templates = [
  'MNI Colin 27',
  'ICBM 152 2009c Nonlinear Asymmetric'
]

const newShouldHaveReceptor = [
  ["Area 4p (PreCG)", 1, 1, 1],
  ["Area 3b (PostCG)", 1, 1, 1],
  ["DG (Hippocampus)", 0, 0, 1],
  ["Area FG2 (FusG)", 0, 1, 1],
  ["Area hOc1 (V1, 17, CalcS)" ,1,  1, 1],
  ["Area PFm (IPL)", 0, 1, 1],
  ["Area 44 (IFG)", 0, 0, 1],
  ["CA3 (Hippocampus)", 0, 0, 1],
  ["CA2 (Hippocampus)", 0, 0, 1],
  ["CA1 (Hippocampus)", 0, 0, 1],
  ["Area PGp (IPL)", 0, 0, 1],
  ["CA1 (Hippocampus)", 0, 0, 1],
  ["Area 45 (IFG)", 1, 1, 1],
  ["Area hOc3v (LingG)", 0, 0, 1],
  ["Area hOc3d (Cuneus)", 0, 0, 1],
  ["Area 7A (SPL)", 1, 1, 1],
  ["Area 44 (IFG)", 1, 1, 1],
  ["Area hOc2 (V2, 18)", 0, 0, 1],
  ["Area PFop (IPL)", 0, 0, 1],
  ["Area PF (IPL)", 0, 0, 1],
  ["CA2 (Hippocampus)", 0, 0, 1],
  ["Area PFt (IPL)", 0, 0, 1],
  ["Area TE 2.1 (STG)", 0, 0, 1],
  ["Area PFcm (IPL)", 0, 0, 1],
  ["CA3 (Hippocampus)", 0, 0, 1],
  ["DG (Hippocampus)", 0, 0, 1],
  ["CA3 (Hippocampus)", 0, 0, 1],
  ["CA2 (Hippocampus)", 0, 0, 1],
  ["CA1 (Hippocampus)", 0, 0, 1],
  ["CA3 (Hippocampus)", 0, 0, 1],
  ["CA2 (Hippocampus)", 0, 0, 1],
  ["CA1 (Hippocampus)", 0, 0, 1],
  ["Area FG1 (FusG)", 0, 1, 1],
  ["CA3 (Hippocampus)", 0, 0, 1],
  ["Area TE 1.0 (HESCHL)", 0, 0, 1],
  ["CA1 (Hippocampus)", 0, 0, 1],
  ["Area hOc2 (V2, 18)", 0, 0, 1],
  ["CA2 (Hippocampus)", 0, 0, 1],
  ["CA3 (Hippocampus)", 0, 0, 1],
  ["CA2 (Hippocampus)", 0, 0, 1],
  ["CA1 (Hippocampus)", 0, 0, 1],
  ["Area PGa (IPL)", 0, 0, 1],
].filter(
  ([ name ]) =>
    /**
     * somehow CA2 CA3 is a repeat of CA1 ???
     */
    name !== 'CA2 (Hippocampus)' && name !== 'CA3 (Hippocampus)'
    /**
     * not yet in dev branch
     */
    && name !== 'Area TE 2.1 (STG)'
).map(
  /**
   * change remaining CA1 Hippocampus to searchable name
   */
  ([ name, ...rest ]) => name === 'CA1 (Hippocampus)'
    ? [ 'CA (Hippocampus)', ...rest ]
    : [ name, ...rest ]
).reduce((acc, curr) => {
  const [ name, pr, ar, fp ] = curr
  const foundIdx = acc.findIndex(([ accName ]) => name === accName )
  return foundIdx >= 0
    ? acc.map((el, idx) => idx === foundIdx
      ? [ name, el[1] + pr, el[2] + ar, el[3] + fp ]
      : el)
    : acc.concat([curr])
  
}, [])


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
        await iavPage.selectAtlasTemplateParcellation(atlasName, template)

        // account for linear template translation backend
        await iavPage.wait(5000)
        await iavPage.waitUntilAllChunksLoaded()
      })

      afterEach(async () => {
        
      })
      for (const [ area, ...rest ] of newShouldHaveReceptor) {
        it(`> receptor data ${area} should be able to be found`, async () => {
          await iavPage.searchRegionWithText(area)
          await iavPage.wait(2000)
          await iavPage.selectSearchRegionAutocompleteWithText()
          await retry(async () => {
            await iavPage.dismissModal()
            await iavPage._setRegionalFeaturesExpanded(true)
          }, {
            timeout: 2000,
            retries: 10
          })
          await iavPage.wait(2000)
          await iavPage.waitUntilAllChunksLoaded()
          const datasets = await iavPage.getVisibleDatasets()
          const filteredDs = datasets.filter(ds => ds.toLowerCase().indexOf('receptor') >= 0)
          expect(filteredDs.length).toBeGreaterThan(0)
          
        })
      }
    })
  }
})

const template = 'ICBM 2009c Nonlinear Asymmetric'
const area = 'Area hOc1 (V1, 17, CalcS)'

const receptorName = `Density measurements of different receptors for Area hOc1 (V1, 17, CalcS) [human, v1.0]`

// describe('> receptor dataset previews', () => {
//   let iavPage
//   beforeEach(async () => {
//     iavPage = new AtlasPage()
//     await iavPage.init()
//     await iavPage.goto()
//     await iavPage.selectTitleCard(template)
//     await iavPage.wait(500)
//     await iavPage.waitUntilAllChunksLoaded()

//     await iavPage.searchRegionWithText(area)
//     await iavPage.wait(2000)
//     await iavPage.selectSearchRegionAutocompleteWithText()
//     await iavPage.dismissModal()
//     await iavPage.searchRegionWithText('')

//     const datasets = await iavPage.getVisibleDatasets()
//     const receptorIndex = datasets.indexOf(receptorName)

//     await iavPage.clickNthDataset(receptorIndex)
//     await iavPage.wait(500)
//     await iavPage.click(`[aria-label="${ARIA_LABELS.SHOW_DATASET_PREVIEW}"]`)
//     await iavPage.waitFor(true, true)
//   })

//   describe('> can display graph', () => {

//     it('> can display radar graph', async () => {
//       const files = await iavPage.getBottomSheetList()
//       const fingerprintIndex = files.findIndex(file => /fingerprint/i.test(file))
//       await iavPage.clickNthItemFromBottomSheetList(fingerprintIndex)
//       await iavPage.waitFor(true, true)
//       const modalHasCanvas = await iavPage.modalHasChild('canvas')
//       expect(modalHasCanvas).toEqual(true)

//       await iavPage.wait(500)

//       const modalHasDownloadBtn = await iavPage.modalHasChild(`[aria-label="${DOWNLOAD_PREVIEW}"]`)
//       const modalHasDownloadCSVBtn = await iavPage.modalHasChild(`[aria-label="${DOWNLOAD_PREVIEW_CSV}"]`)

//       expect(modalHasDownloadBtn).toEqual(true)
//       expect(modalHasDownloadCSVBtn).toEqual(true)
//     })

//     it('> can display profile', async () => {

//       const files = await iavPage.getBottomSheetList()
//       const profileIndex = files.findIndex(file => /profile/i.test(file))
//       await iavPage.clickNthItemFromBottomSheetList(profileIndex)
//       await iavPage.waitFor(true, true)
//       const modalHasCanvas = await iavPage.modalHasChild('canvas')
//       expect(modalHasCanvas).toEqual(true)

//       await iavPage.wait(500)

//       const modalHasDownloadBtn = await iavPage.modalHasChild(`[aria-label="${DOWNLOAD_PREVIEW}"]`)
//       const modalHasDownloadCSVBtn = await iavPage.modalHasChild(`[aria-label="${DOWNLOAD_PREVIEW_CSV}"]`)

//       expect(modalHasDownloadBtn).toEqual(true)
//       expect(modalHasDownloadCSVBtn).toEqual(true)
//     })
//   })
//   it('> can display image', async () => {
//     const files = await iavPage.getBottomSheetList()
//     const imageIndex = files.findIndex(file => /image\//i.test(file))
//     await iavPage.clickNthItemFromBottomSheetList(imageIndex)
//     await iavPage.wait(500)
//     const modalHasImage = await iavPage.modalHasChild('div[data-img-src]')
//     expect(modalHasImage).toEqual(true)

//     await iavPage.wait(500)

//     const modalHasDownloadBtn = await iavPage.modalHasChild(`[aria-label="${DOWNLOAD_PREVIEW}"]`)
//     const modalHasDownloadCSVBtn = await iavPage.modalHasChild(`[aria-label="${DOWNLOAD_PREVIEW_CSV}"]`)

//     expect(modalHasDownloadBtn).toEqual(true)
//     expect(modalHasDownloadCSVBtn).toEqual(false)
//   })
// })

// describe('> modality picker', () => {
//   let iavPage
//   beforeAll(async () => {
//     iavPage = new AtlasPage()
//     await iavPage.init()
//     await iavPage.goto()
//   })
//   it('> sorted alphabetically', async () => {
//     await iavPage.selectTitleCard(templates[1])
//     await iavPage.wait(500)
//     await iavPage.waitUntilAllChunksLoaded()
//     await iavPage.click(`[aria-label="${TOGGLE_EXPLORE_PANEL}"]`)
//     await iavPage.wait(500)
//     await iavPage.clearAlerts()
//     await iavPage.click(`[aria-label="${MODALITY_FILTER}"]`)
//     await iavPage.wait(500)
//     const modalities = await iavPage.getModalities()
//     for (let i = 1; i < modalities.length; i ++) {
//       expect(
//         modalities[i].charCodeAt(0)
//       ).toBeGreaterThanOrEqual(
//         modalities[i - 1].charCodeAt(0)
//       )
//     }
//   })
// })


// describe('> pmap dataset preview', () => {
//   let iavPage

//   beforeAll(async () => {
//     // loads pmap and centers on hot spot
//     const url = `/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&cNavigation=0.0.0.-W000..2_ZG29.-ASCS.2-8jM2._aAY3..BSR0..dABI~.525x0~.7iMV..1EPC&niftiLayers=https%3A%2F%2Fneuroglancer.humanbrainproject.eu%2Fprecomputed%2FJuBrain%2F17%2Ficbm152casym%2Fpmaps%2FVisual_hOc1_l_N10_nlin2MNI152ASYM2009C_2.4_publicP_d3045ee3c0c4de9820eb1516d2cc72bb.nii.gz&previewingDatasetFiles=%5B%7B"datasetId"%3A"minds%2Fcore%2Fdataset%2Fv1.0.0%2F5c669b77-c981-424a-858d-fe9f527dbc07"%2C"filename"%3A"Area+hOc1+%28V1%2C+17%2C+CalcS%29+%5Bv2.4%2C+ICBM+2009c+Asymmetric%2C+left+hemisphere%5D"%7D%5D`
//     iavPage = new AtlasPage()
//     await iavPage.init()
//     await iavPage.goto(url)
//     await iavPage.waitUntilAllChunksLoaded()
//   })

//   it('> can display pmap', async () => {
//     const { red, green, blue } = await iavPage.getRgbAt({position: [200, 597]})
//     expect(red).toBeGreaterThan(green)
//     expect(red).toBeGreaterThan(blue)
//   })

//   it('> on update of layer control, pmap retains', async () => {
//     // by default, additional layer control is collapsed
//     // await iavPage.toggleLayerControl() // deprecated
//     await iavPage.wait(500)
//     await iavPage.toggleNthLayerControl(0)
//     await iavPage.wait(5500)

//     // interact with control
//     await iavPage.click(`[aria-label="Remove background"]`)
//     await iavPage.wait(500)

//     // color map should be unchanged
//     const { red, green, blue } = await iavPage.getRgbAt({position: [200, 597]})
//     expect(red).toBeGreaterThan(green)
//     expect(red).toBeGreaterThan(blue)
    
//   })
// })
