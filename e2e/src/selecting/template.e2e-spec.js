const { AtlasPage } = require("../util")

describe('selecting template', () => {
  let iavPage
  
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
  })

  it('can select template by clicking main card', async () => {
    await iavPage.goto()
    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)

    const viewerIsPopulated = await iavPage.viewerIsPopulated()
    expect(viewerIsPopulated).toBe(true)
  })
  

  it('switching template after template init by clicking select should work', async () => {

    await iavPage.goto()

    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)

    await iavPage.selectDropdownTemplate('Big Brain (Histology)')
    await iavPage.wait(7000)

    const viewerIsPopulated = await iavPage.viewerIsPopulated()
    expect(viewerIsPopulated).toBe(true)
  })

  it('MNI152 should return desc', async () => {

    const expectedDesc = `An unbiased non-linear average of multiple subjects from the MNI152 database, which provides high-spatial resolution and signal-to-noise while not being biased towards a single brain (Fonov et al., 2011). This template space is widely used as a reference space in neuroimaging. HBP provides the JuBrain probabilistic cytoarchitectonic atlas (Amunts/Zilles, 2015) as well as a probabilistic atlas of large fibre bundles (Guevara, Mangin et al., 2017) in this space.`

    await iavPage.goto()

    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)

    const info = await iavPage.getTemplateInfo()

    expect(
      info.indexOf(expectedDesc)
    ).toBeGreaterThanOrEqual(0)
  })
})
