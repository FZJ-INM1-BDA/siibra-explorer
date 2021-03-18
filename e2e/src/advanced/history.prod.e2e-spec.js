const { WdIavPage } = require('../../util/selenium/iav')
const { AtlasPage } = require('../util')
const { height, width } = require("../../opts")
const atlasName = `Multilevel Human Atlas`

describe('> navigating IAV via history', () => {
  let iavPage = new AtlasPage()
  beforeEach(async () => {
    iavPage = new AtlasPage()
    await iavPage.init()
    await iavPage.goto()
    await iavPage.setAtlasSpecifications(atlasName)
    
    await iavPage.wait(5000)
    await iavPage.waitUntilAllChunksLoaded()
  })

  it('> after navigate, navigation state differs', async () => {
    const nav = await iavPage.getNavigationState()
    await iavPage.cursorMoveToAndDrag({
      position: [ Math.round(width / 4), Math.round(height / 4) ],
      delta: [ Math.round(width / 8), Math.round(height / 8) ]
    })
    const nav2 = await iavPage.getNavigationState()

    // expect some positions to change after dragging
    expect(
      nav.position.some((v, idx) => v !== nav2.position[idx])
    ).toBeTrue()
  })

  it('> after navigate, history back, navigation should ', async () => {
    const nav = await iavPage.getNavigationState()
    await iavPage.cursorMoveToAndDrag({
      position: [ Math.round(width / 4), Math.round(height / 4) ],
      delta: [ Math.round(width / 8), Math.round(height / 8) ]
    })
    await iavPage.wait(5000)
    await iavPage.waitUntilAllChunksLoaded()
    await iavPage.historyBack()
    await iavPage.wait(5000)
    await iavPage.waitUntilAllChunksLoaded()

    const nav2 = await iavPage.getNavigationState()
    // expect some positions to change after dragging
    expect(
      nav.position.every((v, idx) => v === nav2.position[idx])
    ).toBeTrue()
  })

  it('> history back, viewer should despawn ', async () => {

    await iavPage.wait(5000)
    await iavPage.waitUntilAllChunksLoaded()
    await iavPage.historyBack()
    await iavPage.wait(5000)
    await iavPage.waitUntilAllChunksLoaded()

    const flag = await iavPage.viewerIsPopulated()
    expect(flag).toBeFalse()

  })

})