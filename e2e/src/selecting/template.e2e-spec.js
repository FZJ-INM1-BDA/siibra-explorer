const { AtlasPage } = require("../util")

describe('selecting template', () => {
  let iavPage
  
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  it('can select template by clicking main card', async () => {
    await iavPage.goto()
    await iavPage.wait(200)
    await iavPage.dismissModal()
    await iavPage.wait(200)

    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)

    const viewerIsPopulated = await iavPage.viewerIsPopulated()
    expect(viewerIsPopulated).toBe(true)
  })
  

  it('switching template after template init by clicking select should work', async () => {

    await iavPage.goto()
    await iavPage.wait(200)
    await iavPage.dismissModal()
    await iavPage.wait(200)

    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)

    await iavPage.selectDropdownTemplate('Big Brain (Histology)')
    await iavPage.wait(7000)

    const viewerIsPopulated = await iavPage.viewerIsPopulated()
    expect(viewerIsPopulated).toBe(true)
  })
})
