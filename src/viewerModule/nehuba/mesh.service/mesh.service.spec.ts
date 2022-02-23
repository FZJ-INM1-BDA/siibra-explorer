import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector } from "src/services/state/viewerState/selectors"
import { NehubaMeshService } from "./mesh.service"


const fits1 = {
  ngId: 'foobar',
  labelIndex: 123,
  children: []
}

const fits1_1 = {
  ngId: 'foobar',
  labelIndex: 5,
  children: []
}

const fits2 = {
  ngId: 'helloworld',
  labelIndex: 567,
  children: []
}

const fits2_1 = {
  ngId: 'helloworld',
  labelIndex: 11,
  children: []
}

const nofit1 = {
  ngId: 'bazz',
  children: []
}

const nofit2 = {
  ngId: 'but',
  children: []
}

describe('> mesh.server.ts', () => {

  describe('> NehubaMeshService', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore(),
          NehubaMeshService,
        ]
      })
      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
      mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {})
    })

    it('> can be init', () => {
      const service = TestBed.inject(NehubaMeshService)
      expect(service).toBeTruthy()
    })

    it('> mixes in auxillaryMeshIndices', () => {
      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [ fits1 ])

      const service = TestBed.inject(NehubaMeshService)
      expect(
        service.loadMeshes$
      ).toBeObservable(
        hot('(ab)', {
          a: {
            layer: {
              name: fits1.ngId
            },
            labelIndicies: [ fits1.labelIndex ]
          },
          b: {
            layer: {
              name: fits2.ngId,
            },
            labelIndicies: [11, 22]
          }
        })
      )
    })
  })
})
