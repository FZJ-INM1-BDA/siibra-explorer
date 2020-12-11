const { AtlasPage } = require('../../src/util')
const { height, width } = require('../../opts')
const { CONST } = require('../../../common/constants')

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
      await newPage.setAtlasSpecifications(duplicatedRegion.atlas, [ duplicatedRegion.template ])
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

  describe('> [bkwdCompat] multi region select is handled gracefully', () => {
    const url = `?templateSelected=Waxholm+Space+rat+brain+MRI%2FDTI&parcellationSelected=Waxholm+Space+rat+brain+atlas+v2&cRegionsSelected=%7B%22v2%22%3A%2213.a.b.19.6.c.q.x.1.1L.Y.1K.r.s.y.z._.1G.-.Z.18.v.f.g.1J.1C.k.14.15.7.1E.1F.10.11.12.1D.1S.A.1V.1W.1X.1Y.1Z.1a.1i.1j.1k.1m.1n.1o.1p.U.V.W.3.1I.e.d.1T.1H.m.h.n.1U.o.t.2.17.p.w.4.5.1A.1B.u.l.j.16%22%7D&cNavigation=0.0.0.-W000..2-8Bnd.2_tvb9._yymE._tYzz..1Sjt..9Hnn%7E.Lqll%7E.Vcf..9fo`

    const humanAtlasName = `Multilevel Human Atlas`
    let newPage = new AtlasPage()
    beforeAll(async () => {
      await newPage.init()
      await newPage.goto(url)
      /**
       * clear cookie alert
       */
      await newPage.clearAlerts()
      await newPage.wait(500)
      /**
       * clear KG ToS alert
       */
      await newPage.clearAlerts()
    })
    it('> handles waxholm v2 whole brains election', async () => {
      const allChipsVisibility = await newPage.getAllChipsVisibility()
      expect(allChipsVisibility.filter(v => !!v).length).toEqual(2)
      const allChipsText = await newPage.getAllChipsText()
      expect(allChipsText).toContain(CONST.MULTI_REGION_SELECTION)
    })

    it('> on change atlas, multi region panel are dismissed', async () => {
      await newPage.setAtlasSpecifications(humanAtlasName)
      await newPage.wait(500)
      await newPage.waitForAsync()

      const allChipsVisibility = await newPage.getAllChipsVisibility()
      expect(allChipsVisibility.filter(v => !!v).length).toEqual(1)
      const allChipsText = await newPage.getAllChipsText()
      expect(allChipsText).not.toContain(CONST.MULTI_REGION_SELECTION)
    })
  })
})
