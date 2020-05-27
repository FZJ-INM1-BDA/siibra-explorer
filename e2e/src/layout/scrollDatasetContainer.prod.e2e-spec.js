const { AtlasPage } = require('../util')
const { ARIA_LABELS } = require('../../../common/constants')
describe('> scroll dataset container', () => {
  let iavPage

  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()

  })

  it('> can scroll to the end', async () => {
    await iavPage.goto()
    await iavPage.selectTitleCard('ICBM 2009c Nonlinear Asymmetric')
    await iavPage.wait(1000)
    await iavPage.waitForAsync()

    await iavPage.click(`[aria-label="${ARIA_LABELS.TOGGLE_EXPLORE_PANEL}"]`)

    await iavPage.clearAlerts()

    let countdown = 100
    do {
      await iavPage.scrollElementBy(`[aria-label="${ARIA_LABELS.LIST_OF_DATASETS}"]`, {
        delta: [0, 100]
      })
      await iavPage.wait(100)
      countdown --
    }while(countdown > 0)

    await iavPage.wait(500)

    const val = await iavPage.getScrollStatus(`[aria-label="${ARIA_LABELS.LIST_OF_DATASETS}"]`)
    expect(val).toBeGreaterThanOrEqual(10000)
  })
})