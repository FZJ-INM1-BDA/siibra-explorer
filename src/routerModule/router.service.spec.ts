import { APP_BASE_HREF, Location } from "@angular/common"
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from "@angular/core/testing"
import { Router } from "@angular/router"
import { RouterTestingModule } from '@angular/router/testing'
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { of } from "rxjs"
import { viewerStateFetchedAtlasesSelector, viewerStateFetchedTemplatesSelector } from "src/services/state/viewerState/selectors"
import { PureContantService } from "src/util"
import { RouterService } from "./router.service"
import * as util from './util'

const { routes, DummyCmp } = util
const dummyPureConstantService = {
  getTemplateEndpoint$: of(['dummy']),
  totalAtlasesLength: 2
}

let cvtStateToHashedRoutesSpy: jasmine.Spy 
let cvtFullRouteToStateSpy: jasmine.Spy 
let location: Location
let router: Router

describe('> router.service.ts', () => {
  describe('> RouterService', () => {
    beforeEach(() => {
      cvtStateToHashedRoutesSpy= jasmine.createSpy('cvtStateToHashedRoutesSpy')
      cvtFullRouteToStateSpy= jasmine.createSpy('cvtFullRouteToState')

      spyOnProperty(util, 'cvtStateToHashedRoutes').and.returnValue(cvtStateToHashedRoutesSpy)
      spyOnProperty(util, 'cvtFullRouteToState').and.returnValue(cvtFullRouteToStateSpy)

      TestBed.configureTestingModule({
        imports: [
          RouterTestingModule.withRoutes(routes, {
            useHash: true
          }),
        ],
        declarations: [
          DummyCmp,
        ],
        providers: [
          provideMockStore(),
          {
            provide: PureContantService,
            useValue: dummyPureConstantService
          },
          {
            provide: APP_BASE_HREF,
            useValue: '/'
          }
        ]
      })

      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateFetchedTemplatesSelector, ['dummy'])
      mockStore.overrideSelector(viewerStateFetchedAtlasesSelector, ['foo', 'bar'])
    })

    afterEach(() => {
      cvtStateToHashedRoutesSpy.calls.reset()
      cvtFullRouteToStateSpy.calls.reset()
    })
    it('> can be init, and configuration emits allFetchingReady$', () => {
      const service = TestBed.inject(RouterService)
      expect(service).toBeTruthy()
      expect(
        service['allFetchingReady$']
      ).toBeObservable(
        hot('(a|)', {
          a: true
        })
      )
    })

    describe('> on state set', () => {

      it('> should call cvtStateToHashedRoutes', fakeAsync(() => {
        cvtStateToHashedRoutesSpy.and.callFake(() => [])
        const service = TestBed.inject(RouterService)
        const store = TestBed.inject(MockStore)
        const fakeState = {
          foo: 'bar'
        }
        store.setState(fakeState)
        tick(320)
        expect(cvtStateToHashedRoutesSpy).toHaveBeenCalledWith(fakeState)
      }))
      it('> if cvtStateToHashedRoutes throws, should navigate to home', fakeAsync(() => {
        cvtStateToHashedRoutesSpy.and.callFake(() => {
          throw new Error(`foo bar`)
        })
        const service = TestBed.inject(RouterService)
        const store = TestBed.inject(MockStore)
        const fakeState = {
          foo: 'bar'
        }
        store.setState(fakeState)
        tick(320)
        location = TestBed.inject(Location)
        expect(
          location.path()
        ).toBe('/')

      }))
      it('> if cvtStateToHashedRoutes returns, should navigate to expected location', fakeAsync(() => {
        cvtStateToHashedRoutesSpy.and.callFake(() => {
          return ['foo', 'bar']
        })
        const service = TestBed.inject(RouterService)
        const store = TestBed.inject(MockStore)
        const fakeState = {
          foo: 'bar'
        }
        store.setState(fakeState)
        tick(320)
        location = TestBed.inject(Location)
        expect(
          location.path()
        ).toBe('/foo/bar')
      }))
    })
  
    describe('> on route change', () => {


      describe('> compares new state and previous state', () => {

        it('> calls cvtFullRouteToState', fakeAsync(() => {
          const fakeParsedState = {
            bizz: 'buzz'
          }
          cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
          cvtStateToHashedRoutesSpy.and.callFake(() => {
            return ['bizz', 'buzz']
          })
          router = TestBed.inject(Router)
          router.navigate(['foo', 'bar'])
  
          const service = TestBed.inject(RouterService)
  
          tick()
  
          expect(cvtFullRouteToStateSpy).toHaveBeenCalledWith(
            router.parseUrl('/foo/bar'), {}, service['logError']
          )
  
          discardPeriodicTasks()
  
        }))

        it('> calls cvtStateToHashedRoutes with current state', fakeAsync(() => {
          const fakeParsedState = {
            bizz: 'buzz'
          }
          const fakeState = {
            foo: 'bar'
          }
          cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
          const store = TestBed.inject(MockStore)
          store.setState(fakeState)

          cvtStateToHashedRoutesSpy.and.callFake(() => {
            return ['bizz', 'buzz']
          })
          router = TestBed.inject(Router)
          router.navigate(['foo', 'bar'])
  
          TestBed.inject(RouterService)
  
          tick()
  
          expect(cvtStateToHashedRoutesSpy).toHaveBeenCalledWith(fakeState)

          discardPeriodicTasks()
        }))

        describe('> when cvtStateToHashedRoutes ...', () => {
          it('> ...throws, should handle elegantly', fakeAsync(() => {
            const fakeParsedState = {
              bizz: 'buzz'
            }
            cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
            cvtStateToHashedRoutesSpy.and.callFake(() => {
              throw new Error(`fizz buzz`)
            })
            router = TestBed.inject(Router)
            router.navigate(['foo', 'bar'])
    
            TestBed.inject(RouterService)
            const store = TestBed.inject(MockStore)
            const dispatchSpy = spyOn(store, 'dispatch')
            
            tick()

            expect(dispatchSpy).toHaveBeenCalled()
    
            discardPeriodicTasks()
          }))

          it('> ... returns different value, dispatches', fakeAsync(() => {
            const fakeParsedState = {
              bizz: 'buzz'
            }
            cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
            cvtStateToHashedRoutesSpy.and.callFake(() => {
              return ['fizz', 'buzz']
            })
            router = TestBed.inject(Router)
            router.navigate(['foo', 'bar'])
    
            TestBed.inject(RouterService)
            const store = TestBed.inject(MockStore)
            const dispatchSpy = spyOn(store, 'dispatch')
            
            tick()

            expect(dispatchSpy).toHaveBeenCalled()
    
            discardPeriodicTasks()
          }))

          it('> ... returns same value, does not dispatches', fakeAsync(() => {
            const fakeParsedState = {
              bizz: 'buzz'
            }
            cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
            cvtStateToHashedRoutesSpy.and.callFake(() => {
              return ['foo', 'bar']
            })
            router = TestBed.inject(Router)
            router.navigate(['foo', 'bar'])
    
            const service = TestBed.inject(RouterService)
            service['firstRenderFlag'] = false
            const store = TestBed.inject(MockStore)
            const dispatchSpy = spyOn(store, 'dispatch')
            
            tick()

            expect(dispatchSpy).not.toHaveBeenCalled()
    
            discardPeriodicTasks()
          }))
        })
      })
    })
  })
})
