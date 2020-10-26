const { AtlasPage } = require('../../src/util')
const { height, width } = require('../../opts')

describe('> selecting regions', () => {

  const duplicatedRegion = {
    atlas: 'Multilevel Human Atlas',
    template: `ICBM 152 2009c Nonlinear Asymmetric`,
    position: [-0.256, 26.028, -11.678]
  }
  describe(`> when selecting duplicated regions at ${duplicatedRegion.atlas} / ${duplicatedRegion.template} / ${JSON.stringify(duplicatedRegion.position)}`, () => {
    it(`> when click, should only select a single region`, async () => {
      const newPage = new AtlasPage()
      await newPage.init()
      await newPage.goto()
      await newPage.selectAtlasTemplateParcellation(duplicatedRegion.atlas, duplicatedRegion.template)
      await newPage.wait(500)
      await newPage.waitForAsync()
      await newPage.execScript(`interactiveViewer.viewerHandle.setNavigationLoc(${JSON.stringify(duplicatedRegion.position.map(v => v*1e6))}, true)`)
      await newPage.wait(500)
      await newPage.cursorMoveTo({
        position: [ width * 3 / 4, height / 4 ]
      })
      await newPage.wait(500)
      const txt = await newPage.getText(`[floatingMouseContextualContainerDirective]`)
      expect(txt.indexOf(`left`)).toBeGreaterThanOrEqual(0)
      expect(txt.indexOf(`right`)).toBeGreaterThanOrEqual(0)

      await newPage.cursorMoveToAndClick({
        position: [width * 3 / 4, height / 4]
      })
      await newPage.wait(500)
      await newPage.waitForAsync()
      const visible = await newPage.areVisible(`region-menu`)
      expect(visible.length).toEqual(1)

    })
  })
})
