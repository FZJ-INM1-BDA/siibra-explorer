const { AtlasPage } = require('../util')
const { CONST } = require('../../../common/constants')
const { retry } = require('../../../common/util')

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
            await iavPage.toggleExpansionPanelState(`${CONST.REGIONAL_FEATURES}`, true)
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
