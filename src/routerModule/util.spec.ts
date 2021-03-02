import { TestBed } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { uiStatePreviewingDatasetFilesSelector } from 'src/services/state/uiState/selectors'
import { viewerStateGetSelectedAtlas, viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector, viewerStateSelectorNavigation, viewerStateSelectorStandaloneVolumes } from 'src/services/state/viewerState/selectors'
import { cvtStateToHashedRoutes } from './util'
import { encodeNumber } from './cipher'

describe('> util.ts', () => {
  describe('> cvtFullRouteToState', () => {
    beforeEach(() => {
    })
    it('> should be able to decode region properly', () => {

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
    it('> should be able encode region properly', () => {
      const ngId = 'foobar'
      const labelIndex = 124
      mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [{
        labelIndex,
        ngId
      }])
      const s = cvtStateToHashedRoutes({})
      expect(s).toContain(`r:${ngId}::${encodeNumber(labelIndex, { float: false })}`)
    })
  })
})
