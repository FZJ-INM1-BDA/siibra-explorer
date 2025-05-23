import { TestBed } from "@angular/core/testing"
import { of } from "rxjs"
import { SAPI } from "src/atlasComponents/sapi"
import { RouteStateTransformSvc } from "./routeStateTransform.service"
import { DefaultUrlSerializer } from "@angular/router"
import { atlasAppearance, atlasSelection, userInteraction, userInterface } from "src/state"
import { QuickHash } from "src/util/fn"
import { NEHUBA_CONFIG_SERVICE_TOKEN } from "src/viewerModule/nehuba/config.service"
import { MockStore, provideMockStore } from "@ngrx/store/testing"

const serializer = new DefaultUrlSerializer()

describe("> routeStateTransform.service.ts", () => {
  describe("> RouteStateTransformSvc", () => {
    let svc: RouteStateTransformSvc
    const getParcNgIdSpy = jasmine.createSpy("getParcNgIdSpy")
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore(),
          RouteStateTransformSvc,
          {
            provide: SAPI,
            useValue: {
              atlases$: of([]),
              getSpaceDetail: jasmine.createSpy('getSpaceDetail'),
              getParcDetail: jasmine.createSpy('getParcDetail'),
              getParcRegions: jasmine.createSpy('getParcRegions'),
              getRegionLabelIndices: jasmine.createSpy('getRegionLabelIndices')
            }
          },
          {
            provide: NEHUBA_CONFIG_SERVICE_TOKEN,
            useValue: {
              getParcNgId: getParcNgIdSpy,
              getNehubaConfig: () => {}
            }
          }
        ]
      })
      svc = TestBed.inject(RouteStateTransformSvc)
    })

    describe("> cvtRouteToState", () => {
      describe("> decode region", () => {

      })

      describe("> decode sv", () => {
        let sv: string[]
        beforeEach(async () => {
          const searchParam = new URLSearchParams()
          searchParam.set('standaloneVolumes', '["precomputed://https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/imgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64"]')
          const url = `foo/bar?${searchParam.toString()}`
          const urlTree = serializer.parse(url)
          const state = await svc.cvtRouteToState(urlTree)
          sv = state["[state.atlasSelection]"].standAloneVolumes
        })
  
        it('> sv should be truthy', () => {
          expect(sv).toBeTruthy()
        })
  
        it('> sv should be array', () => {
          expect(
            Array.isArray(sv)
          ).toBeTrue()
        })
  
        it('> sv should have length 1', () => {
          expect(sv.length).toEqual(1)
        })
  
        it('> sv[0] should be expected value', () => {
          expect(sv[0]).toEqual(
            'precomputed://https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/imgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64'
          )
        })
      })

      describe("> decode navigation", () => {
        beforeEach(() => {
        })
        // it('> if not present, should show something palatable', async () => {

        //   const scale = 0.25
  
        //   const url = `/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2/p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-290`

        //   const urlTree = serializer.parse(url)
        //   const state = await svc.cvtRouteToState(urlTree)
          
        //   const { navigation } = state["[state.atlasSelection]"]
        //   const {
        //     orientation,
        //     perspectiveOrientation,
        //     position,
        //     zoom,
        //     perspectiveZoom,
        //   } = navigation
  
        //   expect(orientation).toEqual([0,0,0,1])
        //   expect(perspectiveOrientation).toEqual([
        //     0.3140767216682434,
        //     -0.7418519854545593,
        //     0.4988985061645508,
        //     -0.3195493221282959
        //   ])
        //   expect(position).toEqual([0,0,0])
        //   expect(zoom).toEqual(350000 * scale)
        //   expect(perspectiveZoom).toEqual(1922235.5293810747 * scale)
        // })
      })
    })
    
    describe("> cvtStateToRoute", () => {

      describe('> should be able encode region properly', () => {
        

        const altasObj = {"@id": 'foo-bar-a'}
        const templObj = {"@id": 'foo-bar-t'}
        const parcObj = {"@id": 'foo-bar-p'}
        const regions = [{'name': 'selected-region-1'}]
        const standAloneVolumes = []
        const navigation = null

        beforeEach(() => {
          const store = TestBed.inject(MockStore)
          store.overrideSelector(atlasSelection.selectors.selectedAtlas, altasObj as any)
          store.overrideSelector(atlasSelection.selectors.selectedParcellation, templObj as any)
          store.overrideSelector(atlasSelection.selectors.selectedTemplate, parcObj as any)
          store.overrideSelector(atlasSelection.selectors.selectedRegions, regions as any)
          store.overrideSelector(atlasSelection.selectors.standaloneVolumes, standAloneVolumes as any)
          store.overrideSelector(atlasSelection.selectors.navigation, navigation as any)
          
          store.overrideSelector(userInteraction.selectors.selectedFeature, null)
          store.overrideSelector(userInterface.selectors.panelMode, "FOUR_PANEL")
          store.overrideSelector(userInterface.selectors.panelOrder, "0123")
          store.overrideSelector(atlasAppearance.selectors.octantRemoval, false)
          store.overrideSelector(atlasAppearance.selectors.showDelineation, true)
          store.overrideSelector(atlasAppearance.selectors.meshTransparency, 1.0)
        })

        afterEach(() => {
          getParcNgIdSpy.calls.reset()
        })


        it('> regular ngId', async () => {
          const ngId = 'foobar'
          const labelIndex = 124
          const decoded = 'buzz'
          
          getParcNgIdSpy.and.returnValue(ngId)

          const state = {}
          const svc = TestBed.inject(RouteStateTransformSvc)
          const sapi = TestBed.inject(SAPI)
          
          const getRegionLabelIndicesSpy = sapi.getRegionLabelIndices as jasmine.Spy
          getRegionLabelIndicesSpy.and.resolveTo(labelIndex)
          const s = await svc.cvtStateToRoute(state as any)
          
          expect(getParcNgIdSpy).not.toHaveBeenCalled()
          expect(getRegionLabelIndicesSpy).not.toHaveBeenCalled()

          expect(s).toContain(`rn:${QuickHash.GetHash(regions[0].name)}`)
        })
  
        it('> ngId containing expected value', async () => {
          /**
           * TODO add new test
           */
        })
      })
    })
  })
})
