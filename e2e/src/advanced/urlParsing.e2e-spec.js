const { AtlasPage } = require("../util")
const proxy = require('selenium-webdriver/proxy')

describe('url parsing', () => {
  let iavPage
  
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    
  })

  // tracking issue: https://github.com/HumanBrainProject/interactive-viewer/issues/455
  // reenable when fixed
  // it('incorrectly defined templateSelected should clear searchparam', async () => {
  //   const search = '/?templateSelected=NoName2&parcellationSelected=NoName'
  //   const page = await browser.newPage()
  //   await page.goto(`${ATLAS_URL}${search}`, {waitUntil: 'networkidle2'})
  //   await page.waitFor(500)
  //   const searchParam = await getSearchParam(page)
  //   const searchParamObj = new URLSearchParams(searchParam)
  //   expect(searchParamObj.get('templateSelected')).toBeNull()
  // })

  it('navigation state should be perserved', async () => {

    const searchParam = `/?templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps&cNavigation=zvyba.z0UJ7._WMxv.-TTch..2_cJ0e.2-OUQG._a9qP._QPHw..7LIx..2CQ3O.1FYC.259Wu..2r6`
    const expectedNav = {
      "position": [
        36806872,
        325772,
        34904120
      ],
      "orientation": [
        0.1131771132349968,
        0.031712327152490616,
        0.2527998387813568,
        0.9603527784347534
      ],
      "zoom": 11590,
      "perspectiveZoom": 1922235,
      "perspectiveOrientation": [
        -0.2991955280303955,
        -0.8824243545532227,
        0.28244855999946594,
        0.22810545563697815
      ]
    }

    await iavPage.goto(searchParam, { doNotAutomate: true })
    await iavPage.wait(2000)
    const actualNav = await iavPage.getNavigationState()

    expect(expectedNav.orientation).toEqual(actualNav.orientation)
    expect(expectedNav.zoom).toEqual(actualNav.zoom)

    // TODO this test fails occassionally
    // tracking issue: https://github.com/HumanBrainProject/interactive-viewer/issues/464
    // expect(expectedNav.position).toEqual(actualNav.position)
    expect(expectedNav.perspectiveOrientation).toEqual(actualNav.perspectiveOrientation)
    expect(expectedNav.perspectiveZoom).toEqual(actualNav.perspectiveZoom)

  })

  it('pluginStates should result in xhr to get pluginManifest', async () => {

    const searchParam = new URLSearchParams()
    searchParam.set('templateSelected', 'MNI 152 ICBM 2009c Nonlinear Asymmetric')
    searchParam.set('parcellationSelected', 'JuBrain Cytoarchitectonic Atlas')
    searchParam.set('pluginStates', 'http://localhost:3001/manifest.json')

    await iavPage.goto(`/?${searchParam.toString()}`, { interceptHttp: true, doNotAutomate: true })
    await iavPage.wait(10000)
    const interceptedCalls = await iavPage.getInterceptedHttpCalls()
    expect(
      interceptedCalls
    ).toContain(jasmine.objectContaining(
      {
        method: 'GET',
        url: 'http://localhost:3001/manifest.json'
      }
    ))
  })
})
