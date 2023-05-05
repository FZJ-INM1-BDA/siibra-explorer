import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { NehubaMeshService } from "./mesh.service"
import { atlasSelection } from "src/state"
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects"
import { NEVER, of, pipe } from "rxjs"
import { mapTo } from "rxjs/operators"
import { selectorAuxMeshes } from "../store"
import { HttpClientModule } from "@angular/common/http"
import { BaseService } from "../base.service/base.service"


const fits1 = {
  name: "foo-bar"
} as SxplrRegion
const fits2 = {
  name: "foobar-foobar"
} as SxplrRegion
const auxMesh = {
  "@id": 'bla',
  labelIndicies: [1,2,3],
  name: 'bla',
  ngId: 'bla',
  rgb: [255, 255, 255] as [number, number, number],
  visible: true,
  displayName: 'bla'
}

describe('> mesh.service.ts', () => {
  
  
  let getATPSpy: jasmine.Spy = jasmine.createSpy('distinctATP')

  const mockAtlas = {
    '@id': 'mockAtlas'
  }
  const mockTmpl = {
    '@id': 'mockTmpl'
  }
  const mockParc = {
    '@id': 'mockParc'
  }

  beforeEach(() => {
    getATPSpy = spyOn(atlasSelection.fromRootStore, 'distinctATP')
    getATPSpy.and.returnValue(
      pipe(
        mapTo({
          atlas: mockAtlas,
          parcellation: mockParc,
          template: mockTmpl
        })
      )
    )
  })

  afterEach(() => {
    
    getATPSpy.calls.reset()
  })
  describe('> NehubaMeshService', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientModule,
        ],
        providers: [
          provideMockStore(),
          NehubaMeshService,
          {
            provide: LayerCtrlEffects,
            useValue: {
              onATPDebounceNgLayers$: NEVER
            }
          },
          {
            provide: BaseService,
            useValue: {
              completeNgIdLabelRegionMap$: NEVER
            }
          }
        ]
      })
    })

    it('> can be init', () => {
      const service = TestBed.inject(NehubaMeshService)
      expect(service).toBeTruthy()
    })

    describe("> loadMeshes$", () => {

      const ngId = 'blabla'
      const labelIndex = 12
      const ngId2 = 'blabla-foo-foo'
      const labelIndex2 = 123

      beforeEach(() => {
        const baseSvc = TestBed.inject(BaseService)
        baseSvc.completeNgIdLabelRegionMap$ = of({
          [ngId]: {
            [labelIndex]: fits1
          },
          [ngId2]: {
            [labelIndex2]: fits2
          }
        })
      })

      describe("> auxMesh defined", () => {

        beforeEach(() => {
          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(selectorAuxMeshes, [auxMesh])
        })

        describe("> no selected region", () => {
          beforeEach(() => {
            const mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [])
          })
          it('> show auxmesh only', () => {

            const service = TestBed.inject(NehubaMeshService)
            expect(
              service.loadMeshes$
            ).toBeObservable(
              hot('(abc)', {
                a: {
                  layer: {
                    name: ngId
                  },
                  labelIndicies:[]
                },
                b: {
                  layer: {
                    name: ngId2
                  },
                  labelIndicies:[]
                },
                c: {
                  layer: {
                    name: auxMesh.ngId,
                  },
                  labelIndicies: auxMesh.labelIndicies
                }
              })
            )
          })
        })

        describe("> has selected region", () => {
          beforeEach(() => {
            const mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [fits1])
          })
          it("> shows both shown mesh and aux mesh", () => {
            
            const service = TestBed.inject(NehubaMeshService)
            expect(
              service.loadMeshes$
            ).toBeObservable(
              hot('(abc)', {
                a: {
                  layer: {
                    name: ngId
                  },
                  labelIndicies: [ labelIndex ]
                },
                b: {
                  layer: {
                    name: ngId2,
                  },
                  labelIndicies: []
                },
                c: {
                  layer: {
                    name: auxMesh.ngId,
                  },
                  labelIndicies: auxMesh.labelIndicies
                }
              })
            )
          })
        })
      })

      describe('> auxmesh not defined', () => {
        beforeEach(() => {
          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(selectorAuxMeshes, [])
        })
        describe("> has no selected region", () => {
          beforeEach(() => {
            const mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [])
          })

          it("> load all meshes", () => {
            
            const service = TestBed.inject(NehubaMeshService)
            expect(
              service.loadMeshes$
            ).toBeObservable(
              hot('(ab)', {
                a: {
                  layer: {
                    name: ngId
                  },
                  labelIndicies: [ labelIndex ]
                },
                b: {
                  layer: {
                    name: ngId2,
                  },
                  labelIndicies: [ labelIndex2 ]
                }
              })
            )
          })
        })

        describe("> has selected region", () => {
          beforeEach(() => {
            const mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [fits1])
          })
          it("> load only selected mesh", () => {

            const service = TestBed.inject(NehubaMeshService)
            expect(
              service.loadMeshes$
            ).toBeObservable(
              hot('(ab)', {
                a: {
                  layer: {
                    name: ngId
                  },
                  labelIndicies: [ labelIndex ]
                },
                b: {
                  layer: {
                    name: ngId2,
                  },
                  labelIndicies: [  ]
                }
              })
            )
          })
        })
      })
    })
  })
})
