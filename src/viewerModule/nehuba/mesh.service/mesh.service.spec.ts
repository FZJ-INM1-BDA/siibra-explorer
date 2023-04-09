import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { NehubaMeshService } from "./mesh.service"
import { atlasSelection } from "src/state"
import { SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import * as configSvc from "../config.service"
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects"
import { NEVER, of, pipe } from "rxjs"
import { mapTo, take } from "rxjs/operators"
import { selectorAuxMeshes } from "../store"


const fits1 = {} as SxplrRegion
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
  let getParcNgIdSpy: jasmine.Spy = jasmine.createSpy('getParcNgId')
  
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
    spyOnProperty(configSvc, 'getParcNgId').and.returnValue(getParcNgIdSpy)
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
    getParcNgIdSpy.calls.reset()
    
    getATPSpy.calls.reset()
  })
  describe('> NehubaMeshService', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore(),
          NehubaMeshService,
          {
            provide: LayerCtrlEffects,
            useValue: {
              onATPDebounceNgLayers$: NEVER
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

      describe("> auxMesh defined", () => {

        const ngId = 'blabla'
        const labelIndex = 12

        beforeEach(() => {

          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [ fits1 ])
          mockStore.overrideSelector(atlasSelection.selectors.selectedParcAllRegions, [])
          mockStore.overrideSelector(selectorAuxMeshes, [auxMesh])
    
          getParcNgIdSpy.and.returnValue(ngId)

        })

        it("> auxMesh ngId labelIndex emitted", () => {

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
                  name: auxMesh.ngId,
                },
                labelIndicies: auxMesh.labelIndicies
              }
            })
          )
        })
      })

      describe("> if multiple ngid and labelindicies are present", () => {

        const ngId1 = 'blabla'
        const labelIndex1 = 12

        const ngId2 = 'foobar'
        const labelIndex2 = 13

        beforeEach(() => {

          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [ fits1 ])
          mockStore.overrideSelector(atlasSelection.selectors.selectedParcAllRegions, [fits1, fits1])
          mockStore.overrideSelector(selectorAuxMeshes, [])
    
          getParcNgIdSpy.and.returnValues(ngId1, ngId2, ngId2)
        })

        it('> should call getParcNgIdSpy and getRegionLabelIndexSpy thrice', () => {
          const service = TestBed.inject(NehubaMeshService)
          service.loadMeshes$.pipe(
            take(1)
          ).subscribe(() => {

            expect(getParcNgIdSpy).toHaveBeenCalledTimes(3)
          })
        })

        /**
         * in the case of julich brain 2.9 in colin 27, we expect selecting a region will hide meshes from all relevant ngIds (both left and right)
         */
        it('> expect the emitted value to be incl all ngIds', () => {
          const service = TestBed.inject(NehubaMeshService)
          expect(
            service.loadMeshes$
          ).toBeObservable(
            hot('(ab)', {
              a: {
                layer: {
                  name: ngId1
                },
                labelIndicies: []
              },
              b: {
                layer: {
                  name: ngId2
                },
                labelIndicies: [ labelIndex2 ]
              }
            })
          )

        })
      })

    })
  })
})
