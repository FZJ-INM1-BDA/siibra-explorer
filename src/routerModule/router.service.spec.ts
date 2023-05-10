import { APP_BASE_HREF, Location } from "@angular/common"
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from "@angular/core/testing"
import { DefaultUrlSerializer, NavigationEnd, Router } from "@angular/router"
import { cold } from "jasmine-marbles"
import { BehaviorSubject, of, Subject } from "rxjs"
import { SAPI } from "src/atlasComponents/sapi"
import { RouterService } from "./router.service"
import { RouteStateTransformSvc } from "./routeStateTransform.service"
import * as util from './util'
import { Store } from "@ngrx/store"
import { MockStore, provideMockStore } from "@ngrx/store/testing"

const { DummyCmp } = util

let cvtStateToRouteSpy: jasmine.Spy 
let cvtRouteToStateSpy: jasmine.Spy 
const mockRouter = {
  events: new Subject(),
  parseUrl: (url: string) => {
    return new DefaultUrlSerializer().parse(url)
  },
  url: '/',
  navigate: jasmine.createSpy('navigate'),
  navigateByUrl: jasmine.createSpy('navigateByUrl')
}

describe('> router.service.ts', () => {
  describe('> RouterService', () => {
    beforeEach(() => {
      cvtStateToRouteSpy = jasmine.createSpy('cvtStateToRouteSpy')
      cvtRouteToStateSpy = jasmine.createSpy('cvtFullRouteToState')

      TestBed.configureTestingModule({
        imports: [],
        declarations: [
          DummyCmp,
        ],
        providers: [
          provideMockStore(),
          {
            provide: APP_BASE_HREF,
            useValue: '/'
          },
          {
            provide: SAPI,
            useValue: {
              atlases$: of([])
            }
          },
          {
            provide: RouteStateTransformSvc,
            useValue: {
              cvtRouteToState: cvtRouteToStateSpy,
              cvtStateToRoute: cvtStateToRouteSpy
            }
          },
          {
            provide: Router,
            useValue: mockRouter
          }
        ]
      })
    })

    afterEach(() => {
      cvtStateToRouteSpy.calls.reset()
      cvtRouteToStateSpy.calls.reset()
      mockRouter.navigateByUrl.calls.reset()
      mockRouter.navigate.calls.reset()
    })
    describe('> on state set', () => {
      const fakeState = {
        foo: 'bar'
      }
      beforeEach(() => {

        cvtRouteToStateSpy.and.resolveTo({
          url: '/',
          stateFromRoute: fakeState
        })
        const store = TestBed.inject(MockStore)
        store.setState(fakeState)
        const service = TestBed.inject(RouterService)
      })

      it('> should call cvtStateToHashedRoutes', fakeAsync(() => {
        cvtStateToRouteSpy.and.rejectWith('boo')
        mockRouter.events.next(
          new NavigationEnd(1, '/', '/')
        )
        tick(400)
        expect(cvtStateToRouteSpy).toHaveBeenCalledWith(fakeState)
      }))
      it('> if cvtStateToRoute throws, should navigate to home', fakeAsync(() => {
        cvtStateToRouteSpy.and.callFake(async () => {
          throw new Error(`foo bar`)
        })
        const baseHref = TestBed.inject(APP_BASE_HREF)

        mockRouter.events.next(
          new NavigationEnd(1, '/', '/')
        )
        tick(400)
        expect(mockRouter.navigate).toHaveBeenCalledWith([baseHref])

      }))
      it('> if cvtStateToHashedRoutes returns, should navigate to expected location', fakeAsync(() => {
        cvtStateToRouteSpy.and.resolveTo(`foo/bar`)
        mockRouter.events.next(
          new NavigationEnd(1, '/', '/')
        )
        tick(400)
        expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/foo/bar')
      }))
    
      describe('> does not excessively call navigateByUrl', () => {

        it('> navigate calls navigateByUrl', fakeAsync(() => {
          cvtStateToRouteSpy.and.resolveTo(`foo/bar`)
          mockRouter.events.next(
            new NavigationEnd(1, '/', '/')
          )
          tick(400)
          expect(cvtStateToRouteSpy).toHaveBeenCalledTimes(1 + 1)
          expect(mockRouter.navigateByUrl).toHaveBeenCalledTimes(1)
        }))

        it('> same state should not navigate', fakeAsync(() => {
          cvtStateToRouteSpy.and.callFake(async () => {
            return `foo/bar`
          })
          mockRouter.events.next(
            new NavigationEnd(1, '/', '/')
          )
          tick(400)
          expect(cvtStateToRouteSpy).toHaveBeenCalledTimes(1 + 1)
          expect(mockRouter.navigateByUrl).toHaveBeenCalledTimes(1)
        }))

        it('> should handle queryParam gracefully', fakeAsync(() => {
          const searchParam = new URLSearchParams()
          const sv = '["precomputed://https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/imgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64"]'
          searchParam.set('standaloneVolumes', sv)
          cvtStateToRouteSpy.and.callFake(async () => {
            return `foo/bar?${searchParam.toString()}`
          })
          mockRouter.events.next(
            new NavigationEnd(1, '/', '/')
          )
          tick(400)
          expect(cvtStateToRouteSpy).toHaveBeenCalledTimes(1 + 1)
          expect(mockRouter.navigateByUrl).toHaveBeenCalledTimes(1)
        }))
      })
    })
  
    describe('> on route change', () => {

      const fakeState = {
        foo: 'bar'
      }
      beforeEach(() => {
        
        cvtRouteToStateSpy.and.resolveTo(fakeState)
        TestBed.inject(RouterService)
        const store = TestBed.inject(MockStore)
        store.setState(fakeState)
        mockRouter.events.next(
          new NavigationEnd(1, '/', '/')
        )
      })

      describe('> compares new state and previous state', () => {
        
        it('> calls cvtRouteToState', fakeAsync(() => {
          tick(320)   
          const fakeParsedState = {
            bizz: 'buzz'
          }
          cvtRouteToStateSpy.and.resolveTo(fakeParsedState)
          cvtStateToRouteSpy.and.callFake(async () => {
            return ['bizz', 'buzz']
          })
          mockRouter.events.next(
            new NavigationEnd(1, '/foo/bar', '/foo/bar')
          )
  
  
          tick(160)
          expect(cvtRouteToStateSpy).toHaveBeenCalledWith(
            new DefaultUrlSerializer().parse('/foo/bar')
          )
        }))

        it('> calls cvtStateToHashedRoutes with current state', fakeAsync(() => {
          const fakeParsedState = {
            bizz: 'buzz'
          }
          const fakeState = {
            foo: 'bar'
          }
          cvtRouteToStateSpy.and.resolveTo(fakeParsedState)
          const store = TestBed.inject(MockStore)
          store.setState(fakeState)

          cvtStateToRouteSpy.and.callFake(() => {
            return ['bizz', 'buzz']
          })
          mockRouter.events.next(
            new NavigationEnd(1, '/foo/bar', '/foo/bar')
          )
  
          tick(160)
  
          expect(cvtStateToRouteSpy).toHaveBeenCalledWith(fakeState)
        }))

        describe('> when cvtStateToHashedRoutes ...', () => {
          it('> ...throws, should handle elegantly', fakeAsync(() => {
            const fakeParsedState = {
              bizz: 'buzz'
            }
            cvtRouteToStateSpy.and.resolveTo(fakeParsedState)
            cvtStateToRouteSpy.and.callFake(async () => {
              throw new Error(`fizz buzz`)
            })
            
            mockRouter.events.next(
              new NavigationEnd(1, '/foo/bar', '/foo/bar')
            )
    
            const store = TestBed.inject(MockStore)
            const dispatchSpy = spyOn(store, 'dispatch')
            
            tick(160)

            expect(dispatchSpy).toHaveBeenCalled()
          }))

          describe("> returns different value", () => {
            beforeEach(() => {

              const fakeParsedState = {
                bizz: 'buzz'
              }
              cvtRouteToStateSpy.and.resolveTo(fakeParsedState)
              cvtStateToRouteSpy.and.resolveTo(`fizz/buzz`)
            })
            it("> dispatches", fakeAsync(() => {

              tick(320)
              mockRouter.events.next(
                new NavigationEnd(1, '/foo/bar', '/foo/bar')
              )
      
              TestBed.inject(RouterService)
              const store = TestBed.inject(MockStore)
              const dispatchSpy = spyOn(store, 'dispatch')
              
              tick(160)

              expect(dispatchSpy).toHaveBeenCalled()
            }))
          })

          describe('> returns the same value', () => {
            it('> ... returns same value, does not dispatches', fakeAsync(() => {
              const fakeParsedState = {
                bizz: 'buzz'
              }
              cvtRouteToStateSpy.and.resolveTo(fakeParsedState)
              cvtStateToRouteSpy.and.callFake(async () => {
                return `foo/bar`
              })
              
              mockRouter.events.next(
                new NavigationEnd(1, '/foo/bar', '/foo/bar')
              )
      
              const service = TestBed.inject(RouterService)
              const store = TestBed.inject(MockStore)
              const dispatchSpy = spyOn(store, 'dispatch')
              
              tick(160)

              expect(dispatchSpy).not.toHaveBeenCalled()
      
            }))
            
            it('> takes into account of customRoute', fakeAsync(() => {
              const fakeParsedState = {
                bizz: 'buzz'
              }
              cvtRouteToStateSpy.and.resolveTo(fakeParsedState)
              cvtStateToRouteSpy.and.callFake(async () => {
                return `foo/bar`
              })
      
              const service = TestBed.inject(RouterService)
              service.customRoute$ = of({
                'x-foo': 'hello'
              })

              
              mockRouter.events.next(
                new NavigationEnd(1, '/foo/bar/x-foo:hello', '/foo/bar/x-foo:hello')
              )

              const store = TestBed.inject(MockStore)
              const dispatchSpy = spyOn(store, 'dispatch')
              
              tick(320)

              expect(dispatchSpy).not.toHaveBeenCalled()
            }))
          })
        })
      })
    })

    describe('> customRoute$', () => {
      let decodeCustomStateSpy: jasmine.Spy

      const fakeState = {
        foo: 'bar'
      }
      let rService: RouterService
      beforeEach(() => {
        cvtRouteToStateSpy.and.resolveTo({
          url: '/',
          stateFromRoute: fakeState
        })
        const store = TestBed.inject(MockStore)
        store.setState(fakeState)
        rService = TestBed.inject(RouterService)
        decodeCustomStateSpy = jasmine.createSpy('decodeCustomState')
        spyOnProperty(util, 'decodeCustomState').and.returnValue(decodeCustomStateSpy)
        mockRouter.events.next(
          new NavigationEnd(0, '/', '/')
        )
      })

      afterEach(() => {
        decodeCustomStateSpy.calls.reset()
      })
      
      it('> emits return record from decodeCustomState', fakeAsync(() => {
        const value = {
          'x-foo': 'bar'
        }
        decodeCustomStateSpy.and.returnValue(value)
        
        mockRouter.events.next(
          new NavigationEnd(1, '/foo', '/foo')
        )
        tick(400)
        expect(rService.customRoute$).toBeObservable(
          cold('a', {
            a: {
              'x-foo': 'bar'
            }
          })
        )
      }))
      it('> merges observable from _customRoutes$', fakeAsync(() => {
        decodeCustomStateSpy.and.returnValue({})
        const rService = TestBed.inject(RouterService)
        rService.setCustomRoute('x-fizz', 'buzz')
        tick(320)
        
        expect(rService.customRoute$).toBeObservable(
          cold('(ba)', {
            a: {
              'x-fizz': 'buzz'
            },
            b: {}
          })
        )
        discardPeriodicTasks()
      }))

      it('> merges from both sources', fakeAsync(() => {
        const value = {
          'x-foo': 'bar'
        }
        decodeCustomStateSpy.and.returnValue(value)
        rService.setCustomRoute('x-fizz', 'buzz')
        tick(400)
        
        expect(rService.customRoute$).toBeObservable(
          cold('(ba)', {
            a: {
              'x-fizz': 'buzz',
              'x-foo': 'bar'
            },
            b: {
              'x-foo': 'bar'
            }
          })
        )
      }))

      it('> subsequent emits overwrites', fakeAsync(() => {
        decodeCustomStateSpy.and.returnValue({})

        const customRouteSpy = jasmine.createSpy('customRouteSpy')
        rService.customRoute$.subscribe(customRouteSpy)
        
        rService.setCustomRoute('x-fizz', 'buzz')
        tick(20)
        rService.setCustomRoute('x-foo', 'bar')
        tick(20)
        rService.setCustomRoute('x-foo', null)

        tick(320)

        const expectedCalls = {
          z: {
            'x-fizz': 'buzz',
            'x-foo': null
          },
          a: {
            'x-fizz': 'buzz',
            'x-foo': 'bar'
          },
          b: {
            'x-fizz': 'buzz'
          }
        }
        for (const c in expectedCalls) {
          expect(customRouteSpy).toHaveBeenCalledWith(expectedCalls[c])
        }
      }))
    })
  })
})
