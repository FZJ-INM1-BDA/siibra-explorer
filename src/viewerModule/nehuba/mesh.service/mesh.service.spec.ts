import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { NehubaMeshService } from "./mesh.service"
import { atlasSelection } from "src/state"
import { SapiRegionModel } from "src/atlasComponents/sapi"
import * as configSvc from "../config.service"
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects"
import { NEVER, of, pipe } from "rxjs"
import { mapTo } from "rxjs/operators"
import { selectorAuxMeshes } from "../store"


const fits1 = {} as SapiRegionModel
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
  let getRegionLabelIndexSpy: jasmine.Spy = jasmine.createSpy('getRegionLabelIndexSpy')
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
    spyOnProperty(configSvc, 'getRegionLabelIndex').and.returnValue(getRegionLabelIndexSpy)
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

    it('> mixes in auxillaryMeshIndices', () => {
      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(atlasSelection.selectors.selectedRegions, [ fits1 ])
      mockStore.overrideSelector(atlasSelection.selectors.selectedParcAllRegions, [])
      mockStore.overrideSelector(selectorAuxMeshes, [auxMesh])

      const ngId = 'blabla'
      const labelIndex = 12
      getParcNgIdSpy.and.returnValue(ngId)
      getRegionLabelIndexSpy.and.returnValue(labelIndex)

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
})
