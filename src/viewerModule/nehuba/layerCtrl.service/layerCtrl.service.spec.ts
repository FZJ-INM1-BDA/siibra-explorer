import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { viewerStateSelectedParcellationSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors"
import { NehubaLayerControlService } from "./layerCtrl.service"
import * as layerCtrlUtil from '../constants'
import { hot } from "jasmine-marbles"


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
    })

    it('> can be init', () => {
      const service = TestBed.inject(NehubaLayerControlService)
      expect(service).toBeTruthy()
    })

    describe('> setColorMap$', () => {
      describe('> overwriteColorMap$ not firing', () => {
        describe('> template/parc has no aux meshes', () => {
          beforeEach(() => {
            mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {})
            mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
          })

          it('> calls getMultiNgIdsRegionsLabelIndexMapReturn', () => {
            const service = TestBed.inject(NehubaLayerControlService)
            service.setColorMap$.subscribe()
            expect(getMultiNgIdsRegionsLabelIndexMapSpy).toHaveBeenCalled()
          })

          it('> emitted value is as expected', () => {
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
            expect(
              service.setColorMap$
            ).toBeObservable(
              hot('a', {
                a: {
                  'foo-bar': {
                    1: { red: 100, green: 200, blue: 255 },
                    2: { red: 15, green: 15, blue: 15}
                  }
                }
              })
            )
          })

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

          it('> should inherit values from tmpl and parc', () => {

            const service = TestBed.inject(NehubaLayerControlService)
            expect(
              service.setColorMap$
            ).toBeObservable(
              hot('a', {
                a: {
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
                }
              })
            )
          })

          it('> should overwrite any value if at all, from region', () => {
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
            expect(
              service.setColorMap$
            ).toBeObservable(
              hot('a', {
                a: {
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
                }
              })
            )
          })
        })
      })
    
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
          service.overwriteColorMap$.next({
            'foo-bar': {
              2: {
                red: 255,
                green: 255,
                blue: 255,
              }
            }
          })

          expect(service.setColorMap$).toBeObservable(
            hot('(ab)', {
              a: {
                'foo-bar': {
                  1: { red: 100, green: 200, blue: 255 },
                  2: { red: 15, green: 15, blue: 15 },
                }
              },
              b: {
                'foo-bar': {
                  2: { red: 255, green: 255, blue: 255 },
                }
              }
            })
          )
        })
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
  })
})
