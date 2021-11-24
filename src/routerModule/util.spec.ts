import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { uiStatePreviewingDatasetFilesSelector } from 'src/services/state/uiState/selectors'
import { viewerStateGetSelectedAtlas, viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector, viewerStateSelectorNavigation, viewerStateSelectorStandaloneVolumes } from 'src/services/state/viewerState/selectors'
import { cvtFullRouteToState, cvtStateToHashedRoutes, DummyCmp, encodeCustomState, routes, verifyCustomState } from './util'
import { encodeNumber } from './cipher'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import * as parsedRoute from './parseRouteToTmplParcReg'
import { spaceMiscInfoMap } from 'src/util/pureConstant.service'

describe('> util.ts', () => {
  describe('> cvtFullRouteToState', () => {

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          RouterTestingModule.withRoutes(routes, {
            useHash: true
          })
        ],
        declarations: [
          DummyCmp
        ]
      })
    })
    beforeEach(() => {
    })
    it('> should be able to decode region properly', () => {

    })

    describe('> decode sv', () => {
      let sv: any
      beforeEach(() => {
        const searchParam = new URLSearchParams()
        searchParam.set('standaloneVolumes', '["precomputed://https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/imgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64"]')
        const svRoute = `/?${searchParam.toString()}`
        const router = TestBed.inject(Router)
        const parsedUrl = router.parseUrl(svRoute)
        const returnState = cvtFullRouteToState(parsedUrl, {})
        sv = returnState?.viewerState?.standaloneVolumes
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

    describe('> navigation', () => {
      let parseSpy: jasmine.Spy
      let mapGetSpy: jasmine.Spy
      beforeEach(() => {
        parseSpy = spyOnProperty(parsedRoute, 'parseSearchParamForTemplateParcellationRegion')
        mapGetSpy = spyOn(spaceMiscInfoMap, 'get')
      })
      it('> if not present, should show something palatable', () => {
        parseSpy.and.returnValue(() => ({
          parcellationSelected: {
            id: 'dummpy-id-parc'
          },
          regionsSelected: [],
          templateSelected: {
            id: 'dummpy-id-tmpl-sel'
          },
        }))

        const scale = 0.25

        mapGetSpy.and.returnValue({ scale })

        const router = TestBed.inject(Router)
        const route = `/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2/p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-290`
        const parsedUrl = router.parseUrl(route)
        const { viewerState = {} } = cvtFullRouteToState(parsedUrl, {}) || {}
        const { navigation } = viewerState
        const {
          orientation,
          perspectiveOrientation,
          position,
          zoom,
          perspectiveZoom,
        } = navigation

        expect(orientation).toEqual([0,0,0,1])
        expect(perspectiveOrientation).toEqual([
          0.3140767216682434,
          -0.7418519854545593,
          0.4988985061645508,
          -0.3195493221282959
        ])
        expect(position).toEqual([0,0,0])
        expect(zoom).toEqual(350000 * scale)
        expect(perspectiveZoom).toEqual(1922235.5293810747 * scale)
      })
    })
  })

  describe('> cvtStateToHashedRoutes', () => {
    let mockStore: MockStore
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore()
        ]
      })

      mockStore = TestBed.inject(MockStore)
      
      mockStore.overrideSelector(viewerStateGetSelectedAtlas, null)
      mockStore.overrideSelector(viewerStateSelectedTemplateSelector, null)
      mockStore.overrideSelector(viewerStateSelectedParcellationSelector, null)
      mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [])
      mockStore.overrideSelector(viewerStateSelectorStandaloneVolumes, [])
      mockStore.overrideSelector(viewerStateSelectorNavigation, null)

      mockStore.overrideSelector(uiStatePreviewingDatasetFilesSelector, [])
    })
    describe('> should be able encode region properly', () => {

      it('> regular ngId', () => {
        const ngId = 'foobar'
        const labelIndex = 124
        mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [{
          labelIndex,
          ngId
        }])
        const s = cvtStateToHashedRoutes({})
        expect(s).toContain(`r:${ngId}::${encodeNumber(labelIndex, { float: false })}`)
      })

      it('> ngId containing ()', () => {

        const ngId = 'foobar(1)'
        const labelIndex = 124
        mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [{
          labelIndex,
          ngId
        }])
        const s = cvtStateToHashedRoutes({})
        expect(s).toContain(`r:foobar%25281%2529::${encodeNumber(labelIndex, { float: false })}`)
      })
    })
  })

  describe('> verifyCustomState', () => {
    it('> should return false on bad custom state', () => {
      expect(verifyCustomState('hello')).toBeFalse()
    })
    it('> should return true on valid custom state', () => {
      expect(verifyCustomState('x-test')).toBeTrue()
    })
  })

  describe('> encodeCustomState', () => {
    describe('> malformed values', () => {
      describe('> bad key', () => {
        it('> throws', () => {
          expect(() => {
            encodeCustomState('hello', 'world')
          }).toThrow()
        })
      })
      describe('> falsy value', () => {
        it('> returns falsy value', () => {
          expect(encodeCustomState('x-test', null)).toBeFalsy()
        })
      })
    })
    describe('> correct values', () => {
      it('> encodes correctly', () => {
        expect(encodeCustomState('x-test', 'foo-bar')).toEqual('x-test:foo-bar')
      })
    })
  })
})
