const { AtlasPage } = require("../util")
const proxy = require('selenium-webdriver/proxy')
const { ARIA_LABELS } = require('../../../common/constants')

describe('> url parsing', () => {
  let iavPage
  
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  it('incorrectly defined templateSelected should clear searchparam', async () => {
    const searchParam = '/?templateSelected=NoName2&parcellationSelected=NoName'
    
    await iavPage.goto(searchParam, { doNotAutomate: true })
    await iavPage.waitFor(500)
    const text = await iavPage.getSnackbarMessage()
    expect(text).toEqual(`Template not found.`)
  })

  it('> navigation state should be perserved', async () => {

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

  it('> if cRegionSelected is defined, should select region in viewer', async () => {
    const url = '/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&cRegionsSelected=%7B"jubrain+mni152+v18+left"%3A"8"%7D'
    await iavPage.goto(url)
    await iavPage.clearAlerts()

    const { red, green, blue } = await iavPage.getRgbAt({ position: [600, 490] })
    expect(red).toBeGreaterThan(0)
    expect(red).toEqual(green)
    expect(red).toEqual(blue)
  })

  it('> [bkwards compat] if ill defined labelIndex for regionsSelected are defined, should handle gracefully', async () => {
    const url = '/?parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&templateSelected=MNI+Colin+27&navigation=0_0_0_1__-0.2753947079181671_0.6631333827972412_-0.6360703706741333_0.2825356423854828__3000000__-17800000_-6700000_-7500000__200000&regionsSelected=142&niftiLayers=https%3A%2F%2Fneuroglancer.humanbrainproject.org%2Fprecomputed%2FJuBrain%2Fv2.2c%2FPMaps%2FBforebrain_4.nii'
    await iavPage.goto(url)
    await iavPage.clearAlerts()
    await iavPage.wait(5000)
    await iavPage.waitForAsync()
    const log = await iavPage.getLog()
    const filteredLog = log.filter(({ message }) => !/Access-Control-Allow-Origin/.test(message))

    // expecting some errors in the console. In catastrophic event, there will most likely be looped errors (on each render cycle)
    expect(
      filteredLog.length
    ).toBeLessThan(50)
  })

  it('> if niftiLayers are defined, parcellation layer should be hidden', async () => {
    const url = `/?parcellationSelected=JuBrain+Cytoarchitectonic+Atlas&templateSelected=MNI+Colin+27&cNavigation=0.0.0.-W000.._NjRq.2-Klk_._-Hmu.2_BdKx..DMVW..1vjMG.4eIG8~.hqT5~..10vB&regionsSelected=142&niftiLayers=https%3A%2F%2Fneuroglancer.humanbrainproject.org%2Fprecomputed%2FJuBrain%2Fv2.2c%2FPMaps%2FBforebrain_4.nii`
    await iavPage.goto(url)
    await iavPage.clearAlerts()

    const { red, green, blue } = await iavPage.getRgbAt({ position: [600, 490] })
    
    expect(red).toBeGreaterThan(0)
    expect(red).toEqual(green)
    expect(red).toEqual(blue)
  })

  it('> if using niftilayers should show deprecation worning')

  it('> pluginStates should be fetched even if no template or parc are selected', async () => {

    const searchParam = new URLSearchParams()
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

  it('> pluginStates should result in xhr to get pluginManifest', async () => {

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
