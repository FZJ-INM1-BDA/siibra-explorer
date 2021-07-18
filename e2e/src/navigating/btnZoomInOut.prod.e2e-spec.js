const { AtlasPage } = require('../util')
const { width, height } = require('../../opts')
const { ARIA_LABELS } = require('../../../common/constants')

describe('> zoom in btns on panels', () => {
  
  let iavPage
  const url = '/?templateSelected=MNI+152+ICBM+2009c+Nonlinear+Asymmetric&parcellationSelected=JuBrain+Cytoarchitectonic+Atlas'

  describe('> on hover overlay elements', () => {
    beforeEach(async () => {
      iavPage = new AtlasPage()
      await iavPage.init()
      await iavPage.goto(url)
    })
    it('> panel btns do not show', async () => {
      
      await iavPage.cursorMoveToElement(`[aria-label="${ARIA_LABELS.SELECT_ATLAS}"]`)

      await iavPage.wait(500)

      const visibleFlags = await iavPage.areVisible(`[aria-label="${ARIA_LABELS.ZOOM_IN}"]`)
      expect(visibleFlags.length).toBe(4)
      expect(visibleFlags).toEqual([false, false, false, false])
    })
  })

  const delta = 30
  const arr = [
    [ width / 2 - delta, height / 2 - delta ],
    [ width / 2 + delta, height / 2 - delta ],
    [ width / 2 - delta, height / 2 + delta ],
    [ width / 2 + delta, height / 2 + delta ],
  ]

  for (const key of [ ARIA_LABELS.ZOOM_IN, ARIA_LABELS.ZOOM_OUT ]) {
    describe(`> testing ${key}`, () => {

      for (const idx in arr) {
        describe(`> panel ${idx}`, () => {
          beforeAll(async () => {
            iavPage = new AtlasPage()
            await iavPage.init()
            await iavPage.goto(url)
          })
          it('> mouse over should show zoom btns', async () => {
            
            await iavPage.cursorMoveTo({
              position: arr[idx]
            })
    
            await iavPage.wait(500)
            const visibleFlags = await iavPage.areVisible(`[aria-label="${key}"]`)
            expect(visibleFlags.length).toBe(4)
    
            const expectedFlags = [false, false, false, false]
            expectedFlags[idx] = true
            expect(visibleFlags).toEqual(expectedFlags)
          })
    
    
          describe(`> "${key}" btns btn works`, () => {
            let o, po, pz, z, p,
            no2, npo2, npz2, nz2, np2
            beforeAll(async () => {
    
              const navState = await iavPage.getNavigationState()
    
              o = navState.orientation
              po = navState.perspectiveOrientation
              pz = navState.perspectiveZoom
              z = navState.zoom
              p = navState.position
    
              const arrOut = await iavPage.areAt(`[aria-label="${key}"]`)
    
              const positionOut = [
                arrOut[idx].x + arrOut[idx].width / 2,
                arrOut[idx].y + arrOut[idx].height / 2
              ]
              await iavPage.cursorMoveToAndClick({
                position: positionOut
              })
              await iavPage.wait(2000)
              const newNavState2 = await iavPage.getNavigationState()
              no2 = newNavState2.orientation
              npo2 = newNavState2.perspectiveOrientation
              npz2 = newNavState2.perspectiveZoom
              nz2 = newNavState2.zoom
              np2 = newNavState2.position
    
            })
    
            it('> expect orientation to be unchanged', () => {
              expect(o).toEqual(no2)
            })
    
            it('> expects perspective orientation to be unchanged', () => {
              expect(po).toEqual(npo2)
            })
    
            it('> expect position to be unchanged', () => {
              expect(p).toEqual(np2)
            })
    
            /**
             * when iterating over array accessor, the key are actually string
             */
            if (Number(idx) === 3) {
              it('> expects zoom to be unchanged', () => {
                expect(z).toEqual(nz2)
              })
              it('> expects perspectivezoom to increase with zoom out btn', () => {
                if (key === ARIA_LABELS.ZOOM_OUT) {
                  expect(pz).toBeLessThan(npz2)
                } else {
                  expect(pz).toBeGreaterThan(npz2)
                }
              })
            } else {
              it('> expects perspective zoom to be unchanged', () => {
                expect(pz).toEqual(npz2)
              })
    
              it('> expect zoom to  increase with zoom out btn', () => {
                if (key === ARIA_LABELS.ZOOM_OUT) {
                  expect(z).toBeLessThan(nz2)
                } else {
                  expect(z).toBeGreaterThan(nz2)
                }
              })
            }
          })
        })
      }
    })
  }
})
