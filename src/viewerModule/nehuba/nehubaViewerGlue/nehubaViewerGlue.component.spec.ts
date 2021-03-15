import { CommonModule } from "@angular/common"
import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { ClickInterceptorService } from "src/glue"
import { PANELS } from "src/services/state/ngViewerState/constants"
import { ngViewerSelectorOctantRemoval, ngViewerSelectorPanelMode, ngViewerSelectorPanelOrder } from "src/services/state/ngViewerState/selectors"
import { uiStateMouseOverSegmentsSelector } from "src/services/state/uiState/selectors"
import { viewerStateSetSelectedRegions } from "src/services/state/viewerState/actions"
import { viewerStateCustomLandmarkSelector, viewerStateNavigationStateSelector, viewerStateSelectedRegionsSelector } from "src/services/state/viewerState/selectors"
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util"
import { NehubaGlueCmp } from "./nehubaViewerGlue.component"

describe('> nehubaViewerGlue.component.ts', () => {
  let mockStore: MockStore
  beforeEach( () => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
      ],
      declarations: [
        NehubaGlueCmp
      ],
      providers: [
        provideMockStore(),
        {
          provide: CLICK_INTERCEPTOR_INJECTOR,
          useFactory: (clickIntService: ClickInterceptorService) => {
            return {
              deregister: clickIntService.removeInterceptor.bind(clickIntService),
              register: clickIntService.addInterceptor.bind(clickIntService)
            } as ClickInterceptor
          },
          deps: [
            ClickInterceptorService
          ]
        },
      ]
    }).overrideComponent(NehubaGlueCmp, {
      set: {
        template: '',
        templateUrl: null
      }
    }).compileComponents()
    mockStore = TestBed.inject(MockStore)
    mockStore.overrideSelector(ngViewerSelectorPanelMode, PANELS.FOUR_PANEL)
    mockStore.overrideSelector(ngViewerSelectorPanelOrder, '0123')
    mockStore.overrideSelector(ngViewerSelectorOctantRemoval, true)
    mockStore.overrideSelector(viewerStateCustomLandmarkSelector, [])
    mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [])
    mockStore.overrideSelector(uiStateMouseOverSegmentsSelector, [])
    mockStore.overrideSelector(viewerStateNavigationStateSelector, null)
  })

  it('> can be init', () => {
    const fixture = TestBed.createComponent(NehubaGlueCmp)
    expect(fixture.componentInstance).toBeTruthy()
  })

  describe('> selectHoveredRegion', () => {
    let dispatchSpy: jasmine.Spy
    let clickIntServ: ClickInterceptorService
    beforeEach(() => {
      dispatchSpy = spyOn(mockStore, 'dispatch')
      clickIntServ = TestBed.inject(ClickInterceptorService)
    })
    afterEach(() => {
      dispatchSpy.calls.reset()
    })

    describe('> if on hover is empty array', () => {
      let fallbackSpy: jasmine.Spy
      beforeEach(() => {
        fallbackSpy = spyOn(clickIntServ, 'fallback')
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.run(null)
      })
      it('> dispatch not called', () => {
        expect(dispatchSpy).not.toHaveBeenCalled()
      })
      it('> fallback called', () => {
        expect(fallbackSpy).toHaveBeenCalled()
      })
    })

    describe('> if on hover is non object array', () => {
      let fallbackSpy: jasmine.Spy

      const testObj0 = {
        segment: 'hello world'
      }
      beforeEach(() => {
        fallbackSpy = spyOn(clickIntServ, 'fallback')
        mockStore.overrideSelector(uiStateMouseOverSegmentsSelector, ['hello world', testObj0])
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.run(null)
      })
      it('> dispatch not called', () => {
        expect(dispatchSpy).not.toHaveBeenCalled()
      })
      it('> fallback called', () => {
        expect(fallbackSpy).toHaveBeenCalled()
      })
    })

    describe('> if on hover array containing at least 1 obj, only dispatch the first obj', () => {
      let fallbackSpy: jasmine.Spy
      const testObj0 = {
        segment: 'hello world'
      }
      const testObj1 = {
        segment: {
          foo: 'baz'
        }
      }
      const testObj2 = {
        segment: {
          hello: 'world'
        }
      }
      beforeEach(() => {
        fallbackSpy = spyOn(clickIntServ, 'fallback')
        mockStore.overrideSelector(uiStateMouseOverSegmentsSelector, [testObj0, testObj1, testObj2])

      })
      afterEach(() => {
        fallbackSpy.calls.reset()
      })
      it('> dispatch called with obj1', () => {
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.run(null)
        const { segment } = testObj1
        expect(dispatchSpy).toHaveBeenCalledWith(
          viewerStateSetSelectedRegions({
            selectRegions: [segment]
          } as any)
        )
      })
      it('> fallback called (does not intercept)', () => {
        TestBed.createComponent(NehubaGlueCmp)
        clickIntServ.run(null)
        expect(fallbackSpy).toHaveBeenCalled()
      })
    })
  })
})
