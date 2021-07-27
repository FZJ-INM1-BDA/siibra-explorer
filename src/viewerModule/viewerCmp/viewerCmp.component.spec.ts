import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { Observable, of, throwError } from "rxjs"
import { viewerStateContextedSelectedRegionsSelector } from "src/services/state/viewerState/selectors"
import { ROIFactory } from "./viewerCmp.component"

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
  describe('> ROIFactory', () => {
    const mockDetail = {
      foo: 'bar'
    }
    class MockPCSvc {
      getRegionDetail(){
        return of(mockDetail)
      }
    }
    const pcsvc = new MockPCSvc()
    let getRegionDetailSpy:  jasmine.Spy

    beforeEach(() => {
      getRegionDetailSpy = spyOn(pcsvc, 'getRegionDetail')
      mockStore.overrideSelector(viewerStateContextedSelectedRegionsSelector, [])
    })
    
    afterEach(() => {
      getRegionDetailSpy.calls.reset()
    })

    describe('> if regoinselected is empty array', () => {
      let returnVal: Observable<any>
      beforeEach(() => {
        getRegionDetailSpy.and.callThrough()
        returnVal = ROIFactory(mockStore, pcsvc as any)
      })
      it('> returns null', () => {
        expect(
          returnVal
        ).toBeObservable(hot('a', {
          a: null
        }))
      })

      it('> regionDetail not called', () => {
        expect(getRegionDetailSpy).not.toHaveBeenCalled()
      })
    })

    describe('> if regionselected is nonempty', () => {
      const mockRegion = {
        context: {
          template: {
            '@id': 'template-id'
          },
          parcellation: {
            '@id': 'parcellation-id'
          },
          atlas: {
            '@id': 'atlas-id'
          }
        },
        ngId: 'foo-bar',
        labelIndex: 123
      }
      const returnDetail = {
        map: {
          hello: 'world'
        }
      }
      let returnVal: Observable<any>
      beforeEach(() => {
        getRegionDetailSpy.and.callFake(() => of(returnDetail))
        mockStore.overrideSelector(viewerStateContextedSelectedRegionsSelector, [mockRegion])
        returnVal = ROIFactory(mockStore, pcsvc as any)
      })

      // TODO check why marble is acting weird
      // and that null is not emitted
      it('> returns as expected', () => {
        expect(returnVal).toBeObservable(
          hot('b', {
            a: null,
            b: {
              ...mockRegion,
              ...returnDetail
            }
          })
        )
        const { context } = mockRegion
        expect(getRegionDetailSpy).toHaveBeenCalledWith(
          context.atlas["@id"],
          context.parcellation["@id"],
          context.template["@id"],
          mockRegion
        )
      })

      it('> if getRegionDetail throws, at least return original region', () => {
        getRegionDetailSpy.and.callFake(() => throwError('blabla'))
        expect(returnVal).toBeObservable(
          hot('b', {
            a: null,
            b: mockRegion
          })
        )
        const { context } = mockRegion
        expect(getRegionDetailSpy).toHaveBeenCalledWith(
          context.atlas["@id"],
          context.parcellation["@id"],
          context.template["@id"],
          mockRegion
        )
      })
    })
  })
})
