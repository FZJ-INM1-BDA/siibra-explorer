import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { of, Subject } from "rxjs"
import { RouterService } from "src/routerModule/router.service"
import { SaneUrlSvc } from "src/share/saneUrl/saneUrl.service"
import { ModularUserAnnotationToolService } from "./tools/service"
import { RoutedAnnotationService } from './routedAnnotation.service'
import { userAnnotationRouteKey } from "./constants"

describe('> routedannotation.service.ts', () => {
  describe('> RoutedAnnotationService', () => {
    const customRouteSub = new Subject()
    const spyRService = {
      customRoute$: customRouteSub.asObservable()
    }
    let spyRSvcCstmRoute: jasmine.Spy
    
    const spySaneUrlSvc = {
      getKeyVal: jasmine.createSpy('getKeyVal')
    }
    const spyAnnSvc = {
      switchAnnotationMode: jasmine.createSpy('switchAnnotationMode'),
      parseAnnotationObject: jasmine.createSpy('parseAnnotationObject'),
      importAnnotation: jasmine.createSpy('importAnnotation')
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
            useValue: spySaneUrlSvc
          }, {
            provide: ModularUserAnnotationToolService,
            useValue: spyAnnSvc
          }
        ],
      })
    })
    afterEach(() => {
      if (spyRSvcCstmRoute) spyRSvcCstmRoute.calls.reset()
      spySaneUrlSvc.getKeyVal.calls.reset()
      spyAnnSvc.switchAnnotationMode.calls.reset()
      spyAnnSvc.parseAnnotationObject.calls.reset()
      spyAnnSvc.importAnnotation.calls.reset()
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
        spySaneUrlSvc.getKeyVal.and.returnValue(
          of(getKeyValReturn)
        )
        spyAnnSvc.parseAnnotationObject.and.returnValues(...parseAnnObjReturn)
      })

      it('> getKeyVal called after at least 160ms', fakeAsync(() => {
        const svc = TestBed.inject(RoutedAnnotationService)
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        tick(160)
        expect(spySaneUrlSvc.getKeyVal).toHaveBeenCalled()
        expect(spySaneUrlSvc.getKeyVal).toHaveBeenCalledWith(mockVal)
      }))

      it('> switchannotation mode is called with "on"', fakeAsync(() => {
        const svc = TestBed.inject(RoutedAnnotationService)
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        tick(160)
        expect(spyAnnSvc.switchAnnotationMode).toHaveBeenCalledOnceWith('on')
      }))

      it('> parseAnnotationObject is called expected number of times', fakeAsync(() => {
        const svc = TestBed.inject(RoutedAnnotationService)
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        tick(160)

        const userAnn = getKeyValReturn[userAnnotationRouteKey]
        expect(spyAnnSvc.parseAnnotationObject).toHaveBeenCalledTimes(userAnn.length)
        for (const ann of userAnn) {
          expect(spyAnnSvc.parseAnnotationObject).toHaveBeenCalledWith(ann)
        }
      }))

      it('> importAnnotation is called expected number of times', fakeAsync(() => {
        const svc = TestBed.inject(RoutedAnnotationService)
        customRouteSub.next({
          [userAnnotationRouteKey]: mockVal
        })
        tick(160)
        expect(spyAnnSvc.importAnnotation).toHaveBeenCalledTimes(parseAnnObjReturn.length)
        for (const obj of parseAnnObjReturn) {
          expect(spyAnnSvc.importAnnotation).toHaveBeenCalledWith(obj)
        }
      }))
    })

    describe('> abnormal operation', () => {
      describe('> routerSvc.customRoute$ emits after 160 ms', () => {
        const mockVal = 'foo-bar'

        it('> getKeyVal should only be called once', fakeAsync(() => {
          const svc = TestBed.inject(RoutedAnnotationService)
          customRouteSub.next({
            [userAnnotationRouteKey]: mockVal
          })
          tick(200)
          customRouteSub.next({
            [userAnnotationRouteKey]: 'hello world'
          })
          tick(160)
          expect(spySaneUrlSvc.getKeyVal).toHaveBeenCalledOnceWith(mockVal)
        }))
      })

      describe('> routerSvc.customRoute$ does not emit valid key', () => {
        it('> does not call getKeyVal', fakeAsync(() => {
          const svc = TestBed.inject(RoutedAnnotationService)
          customRouteSub.next({
            'hello-world': 'foo-bar'
          })
          tick(160)
          expect(spySaneUrlSvc.getKeyVal).not.toHaveBeenCalled()
        }))
      })

      describe('> getKeyVal returns invalid key', () => {
        it('> does not call switchAnnotationMode', fakeAsync(() => {
          spySaneUrlSvc.getKeyVal.and.returnValue(
            of({
              'hello-world': [{
                foo: 'bar',
                fuzz: 'bizz'
              }]
            })
          )
          const svc = TestBed.inject(RoutedAnnotationService)
          customRouteSub.next({
            [userAnnotationRouteKey]: 'foo-bar'
          })
          tick(320)
          expect(spyAnnSvc.switchAnnotationMode).not.toHaveBeenCalled()
        }))
      })
    })
  })
})
