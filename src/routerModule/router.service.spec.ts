import { APP_BASE_HREF, Location } from "@angular/common"
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from "@angular/core/testing"
import { Router } from "@angular/router"
import { RouterTestingModule } from '@angular/router/testing'
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { cold } from "jasmine-marbles"
import { of } from "rxjs"
import { PureContantService } from "src/util"
import { RouterService } from "./router.service"
import * as util from './util'

const { routes, DummyCmp } = util
const dummyPureConstantService = {
  allFetchingReady$: of(true)
}

let cvtStateToHashedRoutesSpy: jasmine.Spy 
let cvtFullRouteToStateSpy: jasmine.Spy 
let location: Location
let router: Router

describe('> router.service.ts', () => {
  describe('> RouterService', () => {
    beforeEach(() => {
      cvtStateToHashedRoutesSpy = jasmine.createSpy('cvtStateToHashedRoutesSpy')
      cvtFullRouteToStateSpy = jasmine.createSpy('cvtFullRouteToState')

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
    })

    afterEach(() => {
      cvtStateToHashedRoutesSpy.calls.reset()
      cvtFullRouteToStateSpy.calls.reset()
    })
    describe('> on state set', () => {

      it('> should call cvtStateToHashedRoutes', fakeAsync(() => {
        cvtStateToHashedRoutesSpy.and.callFake(() => ``)
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
          return `foo/bar`
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
    
      describe('> does not excessively call navigateByUrl', () => {
        let navigateSpy: jasmine.Spy
        let navigateByUrlSpy: jasmine.Spy
        beforeEach(() => {
          const router = TestBed.inject(Router)
          navigateSpy = spyOn(router, 'navigate').and.callThrough()
          navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.callThrough()
        })
        afterEach(() => {
          navigateSpy.calls.reset()
          navigateByUrlSpy.calls.reset()
        })

        it('> navigate calls navigateByUrl', fakeAsync(() => {
          cvtStateToHashedRoutesSpy.and.callFake(() => {
            return `foo/bar`
          })
          TestBed.inject(RouterService)
          const store = TestBed.inject(MockStore)
          store.setState({
            'hello': 'world'
          })
          tick(320)
          expect(cvtStateToHashedRoutesSpy).toHaveBeenCalledTimes(1 + 1)
          expect(navigateByUrlSpy).toHaveBeenCalledTimes(1)
        }))

        it('> same state should not navigate', fakeAsync(() => {
          cvtStateToHashedRoutesSpy.and.callFake(() => {
            return `foo/bar`
          })
          
          TestBed.inject(RouterService)
          const router = TestBed.inject(Router)
          router.navigate(['foo', 'bar'])
          const store = TestBed.inject(MockStore)
          store.setState({
            'hello': 'world'
          })
          tick(320)
          expect(cvtStateToHashedRoutesSpy).toHaveBeenCalledTimes(1 + 1)
          expect(navigateByUrlSpy).toHaveBeenCalledTimes(1)
        }))

        it('> should handle queryParam gracefully', fakeAsync(() => {
          const searchParam = new URLSearchParams()
          const sv = '["precomputed://https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/imgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64"]'
          searchParam.set('standaloneVolumes', sv)
          cvtStateToHashedRoutesSpy.and.callFake(() => {
            return `foo/bar?${searchParam.toString()}`
          })
          TestBed.inject(RouterService)
          const store = TestBed.inject(MockStore)

          TestBed.inject(RouterService)
          const router = TestBed.inject(Router)
          router.navigate(['foo', `bar`], { queryParams: { standaloneVolumes: sv }})
          store.setState({
            'hello': 'world'
          })
          tick(320)
          expect(cvtStateToHashedRoutesSpy).toHaveBeenCalledTimes(1 + 1)
          expect(navigateByUrlSpy).toHaveBeenCalledTimes(1)
        }))
      })
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
              return `fizz/buzz`
            })
            router = TestBed.inject(Router)
            router.navigate(['foo', 'bar'])
    
            TestBed.inject(RouterService)
            const store = TestBed.inject(MockStore)
            const dispatchSpy = spyOn(store, 'dispatch')
            
            tick(320)

            expect(dispatchSpy).toHaveBeenCalled()
    
            discardPeriodicTasks()
          }))

          describe('> returns the same value', () => {
            it('> ... returns same value, does not dispatches', fakeAsync(() => {
              const fakeParsedState = {
                bizz: 'buzz'
              }
              cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
              cvtStateToHashedRoutesSpy.and.callFake(() => {
                return `foo/bar`
              })
              router = TestBed.inject(Router)
              router.navigate(['foo', 'bar'])
      
              const service = TestBed.inject(RouterService)
              const store = TestBed.inject(MockStore)
              const dispatchSpy = spyOn(store, 'dispatch')
              
              tick(320)

              expect(dispatchSpy).not.toHaveBeenCalled()
      
              discardPeriodicTasks()
            }))
            
            it('> takes into account of customRoute', fakeAsync(() => {
              const fakeParsedState = {
                bizz: 'buzz'
              }
              cvtFullRouteToStateSpy.and.callFake(() => fakeParsedState)
              cvtStateToHashedRoutesSpy.and.callFake(() => {
                return `foo/bar`
              })
      
              const service = TestBed.inject(RouterService)
              service.customRoute$ = of({
                'x-foo': 'hello'
              })

              router = TestBed.inject(Router)
              router.navigate(['foo', 'bar', 'x-foo:hello'])

              const store = TestBed.inject(MockStore)
              const dispatchSpy = spyOn(store, 'dispatch')
              
              tick(320)

              expect(dispatchSpy).not.toHaveBeenCalled()
      
              discardPeriodicTasks()
            }))
          })
        })
      })
    })

    describe('> customRoute$', () => {
      let decodeCustomStateSpy: jasmine.Spy
      beforeEach(() => {
        decodeCustomStateSpy = jasmine.createSpy('decodeCustomState')
        spyOnProperty(util, 'decodeCustomState').and.returnValue(decodeCustomStateSpy)

        router = TestBed.inject(Router)
      })

      afterEach(() => {
        decodeCustomStateSpy.calls.reset()
      })
      
      it('> emits return record from decodeCustomState', fakeAsync(() => {
        const value = {
          'x-foo': 'bar'
        }
        decodeCustomStateSpy.and.returnValue(value)
        const rService = TestBed.inject(RouterService)
        router.navigate(['foo'])
        tick(320)
        
        expect(rService.customRoute$).toBeObservable(
          cold('a', {
            a: {
              'x-foo': 'bar'
            }
          })
        )
        discardPeriodicTasks()
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
        const rService = TestBed.inject(RouterService)
        rService.setCustomRoute('x-fizz', 'buzz')
        tick(320)
        
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
        discardPeriodicTasks()
      }))

      it('> subsequent emits overwrites', fakeAsync(() => {
        decodeCustomStateSpy.and.returnValue({})
        const rService = TestBed.inject(RouterService)
        spyOn(router, 'navigateByUrl').and.callFake((() => {
          console.log('navigate by url')
        }) as any)

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
        discardPeriodicTasks()
      }))
    })
  })
})
