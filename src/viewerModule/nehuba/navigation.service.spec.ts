import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { selectViewerConfigAnimationFlag } from 'src/services/state/viewerConfig/selectors'
import { viewerStateSelectorNavigation } from 'src/services/state/viewerState/selectors'
import * as NavUtil from './navigation.util'
import { NehubaViewerUnit } from './nehubaViewer/nehubaViewer.component'
import { NEHUBA_INSTANCE_INJTKN } from './util'
import { NehubaNavigationService } from './navigation.service'

const nav1 = {
  position: [1,2,3],
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [1, 0, 0, 0],
  perspectiveZoom: 100,
  zoom: -12
}

const nav1x2 = {
  position: [2,4,6],
  orientation: [0, 0, 0, 2],
  perspectiveOrientation: [2, 0, 0, 0],
  perspectiveZoom: 200,
  zoom: -24
}

const nav2 = {
  position: [5, 1, -3],
  orientation: [0, 0, 1, 0],
  perspectiveOrientation: [-3, 0, 0, 0],
  perspectiveZoom: 150,
  zoom: -60
}

const nav1p2 = {
  position: [6, 3, 0],
  orientation: [0, 0, 1, 1],
  perspectiveOrientation: [-2, 0, 0, 0],
  perspectiveZoom: 250,
  zoom: -72
}
describe('> navigation.service.ts', () => {

  describe('> NehubaNavigationService', () => {
    let nehubaInst$: BehaviorSubject<NehubaViewerUnit>
    let nehubaInst: Partial<NehubaViewerUnit>
    let service: NehubaNavigationService
    beforeEach(() => {
      nehubaInst$ = new BehaviorSubject(null)
      TestBed.configureTestingModule({
        imports: [

        ],
        providers: [
          provideMockStore(),
          {
            provide: NEHUBA_INSTANCE_INJTKN,
            useValue: nehubaInst$
          },
          NehubaNavigationService
        ]
      })

      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(
        viewerStateSelectorNavigation,
        nav1
      )
      mockStore.overrideSelector(
        selectViewerConfigAnimationFlag,
        true
      )
    })
  
    it('> on new emit null on nehubaInst, clearViewSub is called, but setupviewersub is not called', () => {

      service = TestBed.inject(NehubaNavigationService)
      const clearviewSpy = spyOn(service, 'clearViewerSub').and.callThrough()
      const setupViewSpy = spyOn(service, 'setupViewerSub').and.callThrough()
      nehubaInst$.next(null)
      expect(clearviewSpy).toHaveBeenCalled()
      expect(setupViewSpy).not.toHaveBeenCalled()
    })

    it('> on new emit with viewer, clear view sub and setupviewers are both called', () => {

      service = TestBed.inject(NehubaNavigationService)
      const clearviewSpy = spyOn(service, 'clearViewerSub').and.callThrough()
      const setupViewSpy = spyOn(service, 'setupViewerSub').and.callThrough()
      nehubaInst = {
        viewerPositionChange: of(nav1) as any,
        setNavigationState: jasmine.createSpy()
      }
      nehubaInst$.next(nehubaInst as NehubaViewerUnit)
      expect(clearviewSpy).toHaveBeenCalled()
      expect(setupViewSpy).toHaveBeenCalled()
    })

    describe('> #setupViewerSub', () => {
      let dispatchSpy: jasmine.Spy
      beforeEach(() => {
        nehubaInst = {
          viewerPositionChange: new Subject() as any,
          setNavigationState: jasmine.createSpy(),
        }

        service = TestBed.inject(NehubaNavigationService)
        service['nehubaViewerInstance'] = nehubaInst as NehubaViewerUnit

        const mockStore = TestBed.inject(MockStore)
        mockStore.overrideSelector(viewerStateSelectorNavigation, nav1)
        dispatchSpy = spyOn(mockStore, 'dispatch').and.callFake(() => {})
      })

      describe('> on viewerPosition change multiple times', () => {
        beforeEach(() => {
          service.setupViewerSub()
        })
        it('> viewerNav set to last value', fakeAsync(() => {

          nehubaInst.viewerPositionChange.next(nav2)
          nehubaInst.viewerPositionChange.next(nav1x2)
          expect(
            service.viewerNav
          ).toEqual(nav1x2 as any)
          discardPeriodicTasks()
        }))

        it('> dispatch does not get called immediately', fakeAsync(() => {

          nehubaInst.viewerPositionChange.next(nav2)
          nehubaInst.viewerPositionChange.next(nav1x2)
          expect(dispatchSpy).not.toHaveBeenCalled()
          discardPeriodicTasks()
        }))

        it('> dispatch called after 160 debounce', fakeAsync(() => {
          
          // next/'ing cannot be done in beforeEach
          // or this test will fail
          nehubaInst.viewerPositionChange.next(nav2)
          nehubaInst.viewerPositionChange.next(nav1x2)
          tick(160)
          expect(dispatchSpy).toHaveBeenCalled()
        }))
      })
    })
  
    describe('> on storeNavigation update', () => {
      let navEqlSpy: jasmine.Spy
      beforeEach(() => {
        nehubaInst = {
          setNavigationState: jasmine.createSpy(),
          viewerPositionChange: new Subject() as any,
        }
        nehubaInst$.next(nehubaInst as NehubaViewerUnit)
        navEqlSpy = spyOnProperty(NavUtil, 'navObjEqual')
      })
      it('> if navEq returnt true, do not setNav', () => {
        navEqlSpy.and.returnValue(() => true)
        service = TestBed.inject(NehubaNavigationService)
        expect(nehubaInst.setNavigationState).not.toHaveBeenCalled()
      })
      it('> if navEq return false, call setNav', () => {
        navEqlSpy.and.returnValue(() => false)
        service = TestBed.inject(NehubaNavigationService)
        expect(nehubaInst.setNavigationState).toHaveBeenCalled()
      })
    })
  })
})
