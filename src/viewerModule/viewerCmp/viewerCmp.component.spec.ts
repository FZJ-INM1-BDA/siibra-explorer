import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"


describe('> viewerCmp.component.ts', () => {
  let mockStore: MockStore
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideMockStore()
      ]
    })
    mockStore = TestBed.inject(MockStore)
  })
})
