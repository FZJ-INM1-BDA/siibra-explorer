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

  // TODO test that nav/zoom/orientation are actually preserved
})
