import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { BehaviorSubject, of } from "rxjs"
import { RouterService } from "src/routerModule/router.service"
import { SaneUrlSvc } from "src/share/saneUrl/saneUrl.service"
import { ModularUserAnnotationToolService } from "./tools/service"
import { RoutedAnnotationService } from './routedAnnotation.service'
import { userAnnotationRouteKey } from "./constants"

describe('> routedannotation.service.ts', () => {
  describe('> RoutedAnnotationService', () => {
    const customRouteSub = new BehaviorSubject(null)
    const spyRService = {
      customRoute$: customRouteSub.asObservable(),
      setCustomRoute: jasmine.createSpy("setCustomRoute")
    }
    
    const spyAnnSvc = {
      parseAnnotationObject: jasmine.createSpy('parseAnnotationObject'),
      importAnnotation: jasmine.createSpy('importAnnotation'),
      annotationTools$: of([]),
      focus: jasmine.createSpy('focus'),
    }
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          RoutedAnnotationService,
          {
            provide: RouterService,
            useValue: spyRService
          }, {
            provide: SaneUrlSvc,
            useFactory: () => {
              return {
                getKeyVal: jasmine.createSpy('getKeyVal').and.returnValue(
                  of({})
                )
              }
            }
          }, {
            provide: ModularUserAnnotationToolService,
            useValue: spyAnnSvc
          }
        ],
      })
    })
    afterEach(() => {
      spyAnnSvc.parseAnnotationObject.calls.reset()
      spyAnnSvc.importAnnotation.calls.reset()
      spyAnnSvc.focus.calls.reset()
      spyRService.setCustomRoute.calls.reset()
    })

    it('> can be init', () => {
      const svc = TestBed.inject(RoutedAnnotationService)
      expect(svc instanceof RoutedAnnotationService).toBeTrue()
    })

    describe('> normal operation', () => {
      const mockVal = 'foo-bar'
      const getKeyValReturn = {
        [userAnnotationRouteKey]: [{
          foo: 'bar'
        }, {
          foo: 'hello world'
        }]
      }
      const parseAnnObjReturn = [{
        bar: 'baz'
      }, {
        hello: 'world'
      }]
      
      beforeEach(() => {
        const spySaneUrlSvc = TestBed.inject(SaneUrlSvc) as any
        spySaneUrlSvc.getKeyVal.and.returnValue(
          of(getKeyValReturn)
        )
        spyAnnSvc.parseAnnotationObject.and.returnValues(...parseAnnObjReturn)
      })

      it('> getKeyVal called after at least 160ms', fakeAsync(() => {
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        const svc = TestBed.inject(RoutedAnnotationService)
        tick(200)
        const spySaneUrlSvc = TestBed.inject(SaneUrlSvc) as any
        expect(spySaneUrlSvc.getKeyVal).toHaveBeenCalled()
        expect(spySaneUrlSvc.getKeyVal).toHaveBeenCalledWith(mockVal)
        expect(spyRService.setCustomRoute).toHaveBeenCalledWith(userAnnotationRouteKey, null)
      }))

      it('> focus called', fakeAsync(() => {
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        const svc = TestBed.inject(RoutedAnnotationService)
        tick(200)
        expect(spyAnnSvc.focus).toHaveBeenCalledOnceWith()
      }))

      it('> parseAnnotationObject is called expected number of times', fakeAsync(() => {
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        const svc = TestBed.inject(RoutedAnnotationService)
        tick(200)

        const userAnn = getKeyValReturn[userAnnotationRouteKey]
        expect(spyAnnSvc.parseAnnotationObject).toHaveBeenCalledTimes(userAnn.length)
        for (const ann of userAnn) {
          expect(spyAnnSvc.parseAnnotationObject).toHaveBeenCalledWith(ann)
        }
      }))

      it('> importAnnotation is called expected number of times', fakeAsync(() => {
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        const svc = TestBed.inject(RoutedAnnotationService)
        tick(200)
        expect(spyAnnSvc.parseAnnotationObject).toHaveBeenCalledTimes(parseAnnObjReturn.length)
      }))
    })

    describe('> abnormal operation', () => {
      describe('> routerSvc.customRoute$ emits after 160 ms', () => {
        const mockVal = 'foo-bar'

        it('> getKeyVal should only be called once', fakeAsync(() => {
          customRouteSub.next({
            [userAnnotationRouteKey]: mockVal
          })
          const svc = TestBed.inject(RoutedAnnotationService)
          tick(200)
          customRouteSub.next({
            [userAnnotationRouteKey]: 'hello world'
          })
          tick(200)
          const spySaneUrlSvc = TestBed.inject(SaneUrlSvc) as any
          expect(spySaneUrlSvc.getKeyVal).toHaveBeenCalledOnceWith(mockVal)
        }))
      })

      describe('> routerSvc.customRoute$ does not emit valid key', () => {
        it('> does not call getKeyVal', fakeAsync(() => {
          customRouteSub.next({
            'hello-world': 'foo-bar'
          })
          const svc = TestBed.inject(RoutedAnnotationService)
          tick(200)
          const spySaneUrlSvc = TestBed.inject(SaneUrlSvc) as any
          expect(spySaneUrlSvc.getKeyVal).not.toHaveBeenCalled()
        }))
      })

      describe('> getKeyVal returns invalid key', () => {
        it('> focus is not called', fakeAsync(() => {
          const spySaneUrlSvc = TestBed.inject(SaneUrlSvc) as any
          spySaneUrlSvc.getKeyVal.and.returnValue(
            of({
              'hello-world': [{
                foo: 'bar',
                fuzz: 'bizz'
              }]
            })
          )
          customRouteSub.next({
            [userAnnotationRouteKey]: 'foo-bar'
          })
          const svc = TestBed.inject(RoutedAnnotationService)

          tick(320)
          expect(spyAnnSvc.focus).not.toHaveBeenCalled()
        }))
      })
    })
  })
})
