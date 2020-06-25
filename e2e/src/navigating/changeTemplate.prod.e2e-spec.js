const { AtlasPage } = require('../util')

describe('trans template navigation', () => {
  let iavPage
  
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    
  })

  it('when user moves from template a -> template b, a xhr call is made', async () => {

    const searchParam = new URLSearchParams()
    searchParam.set('templateSelected', 'MNI 152 ICBM 2009c Nonlinear Asymmetric')
    searchParam.set('parcellationSelected', 'JuBrain Cytoarchitectonic Atlas')
    await iavPage.goto(`/?${searchParam.toString()}`, { interceptHttp: true, doNotAutomate: true })
    await iavPage.wait(200)
    await iavPage.dismissModal()

    await iavPage.waitUntilAllChunksLoaded()

    await iavPage.selectDropdownTemplate('Big Brain (Histology)')
    await iavPage.wait(2000)
    const interceptedCalls = await iavPage.getInterceptedHttpCalls()
    
    expect(interceptedCalls).toBeTruthy()

    const found = interceptedCalls && interceptedCalls.find(({ method, url }) => {
      return method === 'POST' && /transform-points/.test(url)
    })
    expect(!!found).toBe(true)
  })

  it('Check region color after template change when region was selected', async () => {

    const url = '/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas'
    const area = 'Area TE 3 (STG) - right hemisphere'
    const expectedPosition = [630, 510]
    const expectedColor = {red: 70, green: 139, blue: 57}

    await iavPage.goto(url, { interceptHttp: true, doNotAutomate: true })
    await iavPage.wait(200)
    await iavPage.dismissModal()
    await iavPage.waitUntilAllChunksLoaded()

    await iavPage.searchRegionWithText(area)
    await iavPage.wait(1000)

    await iavPage.selectSearchRegionAutocompleteWithText()
    await iavPage.dismissModal()
    await iavPage.wait(500)
    await iavPage.selectDropdownTemplate('MNI Colin 27')
    await iavPage.waitUntilAllChunksLoaded()
    const { red, green, blue } = await iavPage.getRgbAt({ position: expectedPosition })

    expect(red).toEqual(expectedColor.red)
    expect(green).toEqual(expectedColor.green)
    expect(blue).toEqual(expectedColor.blue)

  })

  // TODO test that nav/zoom/orientation are actually preserved
})
