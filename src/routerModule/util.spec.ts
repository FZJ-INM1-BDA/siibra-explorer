import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { uiStatePreviewingDatasetFilesSelector } from 'src/services/state/uiState/selectors'
import { viewerStateGetSelectedAtlas, viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector, viewerStateSelectorNavigation, viewerStateSelectorStandaloneVolumes } from 'src/services/state/viewerState/selectors'
import { cvtFullRouteToState, cvtStateToHashedRoutes, DummyCmp, routes } from './util'
import { encodeNumber } from './cipher'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'

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
        expect(s).toContain(`r:foobar%281%29::${encodeNumber(labelIndex, { float: false })}`)
      })
    })
  })
})
