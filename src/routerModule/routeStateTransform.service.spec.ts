import { TestBed } from "@angular/core/testing"
import { of } from "rxjs"
import { SAPI } from "src/atlasComponents/sapi"
import { RouteStateTransformSvc } from "./routeStateTransform.service"
import { DefaultUrlSerializer } from "@angular/router"
import * as nehubaConfigService from "src/viewerModule/nehuba/config.service"
import { atlasSelection } from "src/state"
import { encodeNumber } from "./cipher"

const serializer = new DefaultUrlSerializer()

describe("> routeStateTransform.service.ts", () => {
  describe("> RouteStateTransformSvc", () => {
    let svc: RouteStateTransformSvc
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          RouteStateTransformSvc,
          {
            provide: SAPI,
            useValue: {
              atlases$: of([]),
              getSpaceDetail: jasmine.createSpy('getSpaceDetail'),
              getParcDetail: jasmine.createSpy('getParcDetail'),
              getParcRegions: jasmine.createSpy('getParcRegions'),
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
        let getRegionLabelIndexSpy: jasmine.Spy = jasmine.createSpy('getRegionLabelIndex')
        let getParcNgId: jasmine.Spy = jasmine.createSpy('getParcNgId')
        let atlasSelectionSpy: Record<string, jasmine.Spy> = {
          selectedAtlas: jasmine.createSpy('selectedAtlas'),
          selectedParcellation: jasmine.createSpy('selectedParcellation'),
          selectedTemplate: jasmine.createSpy('selectedTemplate'),
          selectedRegions: jasmine.createSpy('selectedRegions'),
          standaloneVolumes: jasmine.createSpy('standaloneVolumes'),
          navigation: jasmine.createSpy('navigation'),
        }

        const altasObj = {"@id": 'foo-bar-a'}
        const templObj = {"@id": 'foo-bar-t'}
        const parcObj = {"@id": 'foo-bar-p'}
        const regions = [{}]
        const standAloneVolumes = []
        const navigation = null

        beforeEach(() => {
          spyOnProperty(nehubaConfigService, 'getRegionLabelIndex').and.returnValue(getRegionLabelIndexSpy)
          spyOnProperty(nehubaConfigService, 'getParcNgId').and.returnValue(getParcNgId)
          spyOnProperty(atlasSelection, 'selectors').and.returnValue(atlasSelectionSpy)

          atlasSelectionSpy.selectedAtlas.and.returnValue(altasObj)
          atlasSelectionSpy.selectedParcellation.and.returnValue(templObj)
          atlasSelectionSpy.selectedTemplate.and.returnValue(parcObj)
          atlasSelectionSpy.selectedRegions.and.returnValue(regions)
          atlasSelectionSpy.standaloneVolumes.and.returnValue(standAloneVolumes)
          atlasSelectionSpy.navigation.and.returnValue(navigation)

        })

        afterEach(() => {
          getRegionLabelIndexSpy.calls.reset()
          getParcNgId.calls.reset()
          for (const key in atlasSelectionSpy) {
            atlasSelectionSpy[key].calls.reset()
          }
        })

        it('> calls correct functions', () => {

          getRegionLabelIndexSpy.and.returnValue(11)
          getParcNgId.and.returnValue('foo-bar')

          const state = {}
          const svc = TestBed.inject(RouteStateTransformSvc)
          const s = svc.cvtStateToRoute(state as any)

          for (const key in atlasSelectionSpy) {
            expect(atlasSelectionSpy[key]).toHaveBeenCalledTimes(1)
          }
        })

        it('> regular ngId', () => {
          const ngId = 'foobar'
          const labelIndex = 124
          
          getRegionLabelIndexSpy.and.returnValue(labelIndex)
          getParcNgId.and.returnValue(ngId)

          const state = {}
          const svc = TestBed.inject(RouteStateTransformSvc)
          const s = svc.cvtStateToRoute(state as any)

          expect(s).toContain(`r:${ngId}::${encodeNumber(labelIndex, { float: false })}`)
        })
  
        it('> ngId containing ()', () => {
          const ngId = 'foobar(1)'
          const labelIndex = 124

          getRegionLabelIndexSpy.and.returnValue(labelIndex)
          getParcNgId.and.returnValue(ngId)
          
          const state = {}
          const svc = TestBed.inject(RouteStateTransformSvc)
          const s = svc.cvtStateToRoute(state as any)
          expect(s).toContain(`r:foobar%25281%2529::${encodeNumber(labelIndex, { float: false })}`)
        })
      })
    })
  })
})
