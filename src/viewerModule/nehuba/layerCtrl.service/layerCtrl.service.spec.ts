import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { viewerStateCustomLandmarkSelector, viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors"
import { NehubaLayerControlService } from "./layerCtrl.service"
import * as layerCtrlUtil from '../constants'
import { hot } from "jasmine-marbles"
import { IColorMap } from "./layerCtrl.util"
import { debounceTime } from "rxjs/operators"
import { ngViewerSelectorClearView, ngViewerSelectorLayers } from "src/services/state/ngViewerState.store.helper"

describe('> layerctrl.service.ts', () => {
  describe('> NehubaLayerControlService', () => {
    let mockStore: MockStore
    let getMultiNgIdsRegionsLabelIndexMapSpy: jasmine.Spy
    let getMultiNgIdsRegionsLabelIndexMapReturnVal: Map<string, Map<number, layerCtrlUtil.IRegion>>
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          NehubaLayerControlService,
          provideMockStore()
        ]
      })

      mockStore = TestBed.inject(MockStore)
      getMultiNgIdsRegionsLabelIndexMapReturnVal = new Map()
      getMultiNgIdsRegionsLabelIndexMapSpy = spyOnProperty(
        layerCtrlUtil,
        'getMultiNgIdsRegionsLabelIndexMap'
      ).and.returnValue(() => getMultiNgIdsRegionsLabelIndexMapReturnVal)
      mockStore.overrideSelector(viewerStateCustomLandmarkSelector, [])
      mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [])
      mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {})
      mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
    })

    it('> can be init', () => {
      const service = TestBed.inject(NehubaLayerControlService)
      expect(service).toBeTruthy()
    })

    describe('> setColorMap$', () => {
      describe('> overwriteColorMap$ not firing', () => {
        describe('> template/parc has no aux meshes', () => {

          it('> calls getMultiNgIdsRegionsLabelIndexMapReturn', () => {
            const service = TestBed.inject(NehubaLayerControlService)
            service.setColorMap$.subscribe()
            expect(getMultiNgIdsRegionsLabelIndexMapSpy).toHaveBeenCalled()
          })

          it('> emitted value is as expected', fakeAsync(() => {
            const map = new Map<number, layerCtrlUtil.IRegion>()
            getMultiNgIdsRegionsLabelIndexMapReturnVal.set(
              'foo-bar',
              map
            )
            map.set(1, {
              ngId: 'foo-bar',
              rgb: [100, 200, 255]
            })
            map.set(2, {
              ngId: 'foo-bar',
              rgb: [15, 15, 15]
            })

            const service = TestBed.inject(NehubaLayerControlService)
            let v: any
            service.setColorMap$.subscribe(val => {
              v = val
            })
            tick(32)
            const expectedVal = {
              'foo-bar': {
                1: { red: 100, green: 200, blue: 255 },
                2: { red: 15, green: 15, blue: 15}
              }
            }
            expect(v).toEqual(expectedVal)
          }))

        })

        describe('> template/parc has aux meshes', () => {
          let tmplAuxMeshes = [{
            name: 'foo-bar',
            ngId: 'bazz',
            labelIndicies: [1,2,3],
            rgb: [100, 100, 100]
          }, {
            name: 'hello-world',
            ngId: 'hello-world',
            labelIndicies: [4,5,6],
            rgb: [200, 200, 200]
          }]
          let parcAuxMeshes = [{
            name: 'hello-world',
            ngId: 'hello-world',
            labelIndicies: [10,11,12],
            rgb: [255, 255, 255]
          }]
          beforeEach(() => {
            mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {
              auxMeshes: tmplAuxMeshes
            })
            mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {
              auxMeshes: parcAuxMeshes
            })
          })

          it('> should inherit values from tmpl and parc',  fakeAsync(() => {

            const service = TestBed.inject(NehubaLayerControlService)
            let val
            service.setColorMap$.subscribe(v => {
              val = v
            })

            tick(32)

            expect(val).toEqual({
              'bazz': {
                1: { red: 100, green: 100, blue: 100 },
                2: { red: 100, green: 100, blue: 100 },
                3: { red: 100, green: 100, blue: 100 },
              },
              'hello-world': {
                4: { red: 200, green: 200, blue: 200 },
                5: { red: 200, green: 200, blue: 200 },
                6: { red: 200, green: 200, blue: 200 },
                10: { red: 255, green: 255, blue: 255 },
                11: { red: 255, green: 255, blue: 255 },
                12: { red: 255, green: 255, blue: 255 },
              }
            })
          }))

          it('> should overwrite any value if at all, from region', fakeAsync(() => {
            const map = new Map<number, layerCtrlUtil.IRegion>()
            map.set(10, {
              ngId: 'hello-world',
              rgb: [0, 0, 0]
            })
            map.set(15, {
              ngId: 'hello-world',
              rgb: [0, 0, 0]
            })
            getMultiNgIdsRegionsLabelIndexMapReturnVal.set('hello-world', map)

            const service = TestBed.inject(NehubaLayerControlService)
            let val
            service.setColorMap$.subscribe(v => {
              val = v
            })

            tick(32)
            expect(val).toEqual({
              'bazz': {
                1: { red: 100, green: 100, blue: 100 },
                2: { red: 100, green: 100, blue: 100 },
                3: { red: 100, green: 100, blue: 100 },
              },
              'hello-world': {
                4: { red: 200, green: 200, blue: 200 },
                5: { red: 200, green: 200, blue: 200 },
                6: { red: 200, green: 200, blue: 200 },
                10: { red: 255, green: 255, blue: 255 },
                11: { red: 255, green: 255, blue: 255 },
                12: { red: 255, green: 255, blue: 255 },
                15: { red: 0, green: 0, blue: 0 },
              }
            })
          }))
        })
      })

      const foobar1 = {
        'foo-bar': {
          1: { red: 100, green: 200, blue: 255 },
          2: { red: 15, green: 15, blue: 15 },
        }
      }
      const foobar2 = {
        'foo-bar': {
          2: { red: 255, green: 255, blue: 255 },
        }
      }
    
      describe('> overwriteColorMap$ firing', () => {
        beforeEach(() => {
          mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {})
          mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
          const map = new Map<number, layerCtrlUtil.IRegion>()
          getMultiNgIdsRegionsLabelIndexMapReturnVal.set(
            'foo-bar',
            map
          )
          map.set(1, {
            ngId: 'foo-bar',
            rgb: [100, 200, 255]
          })
          map.set(2, {
            ngId: 'foo-bar',
            rgb: [15, 15, 15]
          })
        })

        it('> should overwrite existing colormap', () => {
          const service = TestBed.inject(NehubaLayerControlService)
          service.overwriteColorMap$.next(foobar2)

          expect(service.setColorMap$).toBeObservable(
            hot('(b)', {
              a: foobar1,
              b: foobar2
            })
          )
        })

        it('> unsub/resub should not result in overwritecolormap last emitted value', fakeAsync(() => {
          const service = TestBed.inject(NehubaLayerControlService)

          let subscrbiedVal: IColorMap
          const sub = service.setColorMap$.pipe(
            debounceTime(16),
          ).subscribe(val => {
            subscrbiedVal = val
          })

          // see TODO this is a dirty fix
          tick(32)
          service.overwriteColorMap$.next(foobar2)
          tick(32)
          expect(subscrbiedVal).toEqual(foobar2)
          tick(16)
          sub.unsubscribe()
          subscrbiedVal = null

          // mock emit selectParc etc...
          mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
          mockStore.setState({})
          const sub2 = service.setColorMap$.pipe(
            debounceTime(16),
          ).subscribe(val => {
            subscrbiedVal = val
          })

          tick(32)
          expect(subscrbiedVal).toEqual(foobar1)
          sub2.unsubscribe()

        }))
      })
    })


    describe('> visibleLayer$', () => {
      beforeEach(() => {
        mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {
          ngId: 'tmplNgId',
          auxMeshes: [{
            ngId: 'tmplAuxId1',
            labelIndicies: [1,2,3]
          },{
            ngId: 'tmplAuxId2',
            labelIndicies: [1,2,3]
          }]
        })

        mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {
          auxMeshes: [{
            ngId: 'parcAuxId1',
            labelIndicies: [1,2,3],
          },{
            ngId: 'parcAuxId2',
            labelIndicies: [1,2,3]
          }]
        })

        getMultiNgIdsRegionsLabelIndexMapReturnVal.set(
          'regionsNgId1', null
        )

        getMultiNgIdsRegionsLabelIndexMapReturnVal.set(
          'regionsNgId2', null
        )
      })
      it('> combines ngId of template, aux mesh and regions', () => {
        const service = TestBed.inject(NehubaLayerControlService)
        expect(service.visibleLayer$).toBeObservable(hot('a', {
          a: [
            'tmplNgId',
            'tmplAuxId1',
            'tmplAuxId2',
            'parcAuxId1',
            'parcAuxId2',
            'regionsNgId1',
            'regionsNgId2',
          ]
        }))
      })
    })

    describe('> segmentVis$', () => {
      const region1= {
        ngId: 'ngid',
        labelIndex: 1
      }
      const region2= {
        ngId: 'ngid',
        labelIndex: 2
      }
      beforeEach(() => {
        mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [])
        mockStore.overrideSelector(ngViewerSelectorLayers, [])
        mockStore.overrideSelector(ngViewerSelectorClearView, false)
        mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
      })

      it('> by default, should return []', () => {
        const service = TestBed.inject(NehubaLayerControlService)
        expect(service.segmentVis$).toBeObservable(
          hot('a', {
            a: []
          })
        )
      })

      describe('> if sel regions exist', () => {
        beforeEach(() => {
          mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [
            region1, region2
          ])
        })

        it('> default, should return encoded strings', () => {
          mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [
            region1, region2
          ])
          const service = TestBed.inject(NehubaLayerControlService)
          expect(service.segmentVis$).toBeObservable(
            hot('a', {
              a: [`ngid#1`, `ngid#2`]
            })
          )
        })

        it('> if clearflag is true, then return []', () => {

          mockStore.overrideSelector(ngViewerSelectorClearView, true)
          const service = TestBed.inject(NehubaLayerControlService)
          expect(service.segmentVis$).toBeObservable(
            hot('a', {
              a: []
            })
          )
        })        
      })

      describe('> if non mixable layer exist', () => {
        beforeEach(() => {
          mockStore.overrideSelector(ngViewerSelectorLayers, [{
            mixability: 'nonmixable'
          }])
        })

        it('> default, should return null', () => {
          const service = TestBed.inject(NehubaLayerControlService)
          expect(service.segmentVis$).toBeObservable(
            hot('a', {
              a: null
            })
          )
        })

        it('> if regions selected, should still return null', () => {

          mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [
            region1, region2
          ])
          const service = TestBed.inject(NehubaLayerControlService)
          expect(service.segmentVis$).toBeObservable(
            hot('a', {
              a: null
            })
          )
        })

        describe('> if clear flag is set', () => {
          beforeEach(() => {
            mockStore.overrideSelector(ngViewerSelectorClearView, true)
          })

          it('> default, should return []', () => {
            const service = TestBed.inject(NehubaLayerControlService)
            expect(service.segmentVis$).toBeObservable(
              hot('a', {
                a: []
              })
            )
          })

          it('> if reg selected, should return []', () => {

            mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [
              region1, region2
            ])
            const service = TestBed.inject(NehubaLayerControlService)
            expect(service.segmentVis$).toBeObservable(
              hot('a', {
                a: []
              })
            )
          })
        })
      })
    })

    describe('> ngLayersController$', () => {
      
    })
  })
})
