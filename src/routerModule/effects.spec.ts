import { TestBed, fakeAsync, tick } from "@angular/core/testing"
import { DefaultUrlSerializer, NavigationEnd, Router } from "@angular/router"
import { BehaviorSubject, Subject, of } from "rxjs"
import { SAPI } from "src/atlasComponents/sapi"
import { RouterService } from "./router.service"
import { RouteStateTransformSvc } from "./routeStateTransform.service"
import { APP_BASE_HREF } from "@angular/common"
import { Store } from "@ngrx/store"
import { RouterEffects } from "./effects"
import { STATE_DEBOUNCE_MS } from "./const"
import { NgZone } from "@angular/core"
import { take } from "rxjs/operators"

let mockRouter: any 

const fakeState = {}

describe("> effects.ts", () => {
  describe("> RouterEffects", () => {
    const cvtStateToRouteSpy = jasmine.createSpy('cvtStateToRoute')
    const cvtRouteToStateSpy = jasmine.createSpy('cvtRouteToState')
    let customRoute$: Subject<Record<string, string>>
    let mockStore: Subject<any>
    let effect: RouterEffects
    beforeEach(async () => {
      mockRouter = {
        events: new Subject(),
        parseUrl: (url: string) => {
          return new DefaultUrlSerializer().parse(url)
        },
        url: '/',
        navigate: jasmine.createSpy('navigate'),
        navigateByUrl: jasmine.createSpy('navigateByUrl')
      } as any
      customRoute$ = new BehaviorSubject({})
      mockStore = new BehaviorSubject(null)
      TestBed.configureTestingModule({
        providers: [
          RouterEffects,
          {
            provide: Store,
            useValue: mockStore
          },
          {
            provide: SAPI,
            useValue: {
              atlases$: of(['foo'])
            }
          },
          {
            provide: Router,
            useValue: mockRouter
          },
          {
            provide: RouterService,
            useValue: {
              customRoute$
            }
          },
          {
            provide: RouteStateTransformSvc,
            useValue: {
              cvtRouteToState: cvtRouteToStateSpy,
              cvtStateToRoute: cvtStateToRouteSpy,
            }
          },
          {
            provide: APP_BASE_HREF,
            useValue: '/'
          }
        ]
      })
      const zone = TestBed.inject(NgZone)
      spyOn(zone, 'run').and.callFake((fn) => fn())
      effect = TestBed.inject(RouterEffects)
    })

    afterEach(() => {
      cvtStateToRouteSpy.calls.reset()
      cvtRouteToStateSpy.calls.reset()
    })

    it("> can be init", () => {
      expect(effect).toBeTruthy()
    })
    
    describe('> on state set', () => {
      
      describe("> cvtStateToRoute returns correctly", () => {
        beforeEach(() => {
          cvtStateToRouteSpy.and.resolveTo(`foo/bar`.replace(/^\//, ''))
        })
        it("> should navigate to expected location", async () => {
          await effect.onStateUpdated$.pipe(
            take(1)
          ).toPromise()
          expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/foo/bar')
        })

        describe("> if query param is returned", () => {
          const searchParam = new URLSearchParams()
          const sv = '["precomputed://https://object.cscs.ch/v1/AUTH_08c08f9f119744cbbf77e216988da3eb/imgsvc-46d9d64f-bdac-418e-a41b-b7f805068c64"]'
          searchParam.set('standaloneVolumes', sv)
          beforeEach(() => {
            cvtStateToRouteSpy.and.resolveTo(`foo/bar?${searchParam.toString()}`.replace(/^\//, ''))
          })
          it("> should handle query param gracefaully", async () => {
            await effect.onStateUpdated$.pipe(take(1)).toPromise()
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(`/foo/bar?${searchParam.toString()}`)
          })
        })
      })

      describe("> cvtStateToRoute throws", () => {
        beforeEach(() => {
          cvtStateToRouteSpy.and.rejectWith('foo bar')
        })
        it("> should navigate home", async () => {
          const baseHref = TestBed.inject(APP_BASE_HREF)
          await effect.onStateUpdated$.pipe(
            take(1)
          ).toPromise()

          expect(mockRouter.navigate).toHaveBeenCalledOnceWith([baseHref])
        })
      })

      describe("> on repeated set, but same route", () => {

        const max = 5
        beforeEach(fakeAsync(() => {
          effect.onStateUpdated$.subscribe()

          mockRouter.url = '/foo/bar'
          cvtStateToRouteSpy.and.resolveTo('foo/bar'.replace(/^\//, ''))
          for (let i = 0; i < max; i ++) {
            mockStore.next(i)
            tick(STATE_DEBOUNCE_MS + 100)
          }
        }))
        it("> should call cvtStateToRoute multiple times", () => {
          expect(cvtStateToRouteSpy).toHaveBeenCalledTimes(max)
        })
        it("> should call navigateByUrl 0 times", () => {
          expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
        })
      })
    })
  
    describe('> on route change', () => {
      describe('> custom state is empty', () => {
        beforeEach(() => {
          customRoute$.next({})
        })
        describe("> new route differs from current route", () => {
          const currentRoute = `/foo/bar`
          const newRoute = `/fizz/buzz`
          const currState = {mario:'luigi'}
          const newState = {foo:'bar'}
          beforeEach(() => {
            cvtStateToRouteSpy.and.resolveTo(currentRoute.replace(/^\//, ''))
            cvtRouteToStateSpy.and.resolveTo(newState)
            mockStore.next(currState)
          })
          it("> calls both spies", async () => {
            const pr = Promise.race([
              effect.onRouteUpdate$.pipe(take(1)).toPromise(),
              new Promise(rs => setTimeout(() => {
                rs('food')
              }, 160))
            ])
            mockRouter.events.next(
              new NavigationEnd(1, newRoute, newRoute)
            )
            await pr
            expect(cvtStateToRouteSpy).toHaveBeenCalledOnceWith(currState)
            expect(cvtRouteToStateSpy).toHaveBeenCalledOnceWith(
              mockRouter.parseUrl(newRoute)
            )
          })

          it("> calls applyState", async () => {
            
            const pr = Promise.race([
              effect.onRouteUpdate$.pipe(take(1)).toPromise(),
              new Promise(rs => setTimeout(() => {
                rs('food')
              }, 160))
            ])
            mockRouter.events.next(
              new NavigationEnd(1, newRoute, newRoute)
            )
            const result: any = await pr
            expect(result.state).toEqual(newState as any)
          })
        })

        describe("> new route same as current route", () => {
          const currentRoute = `/foo/bar`
          const newRoute = `/foo/bar`
          const currState = {foo:'bar'}
          const newState = {foo:'bar'}
          beforeEach(() => {
            cvtStateToRouteSpy.and.resolveTo(currentRoute.replace(/^\//, ''))
            cvtRouteToStateSpy.and.resolveTo(newState)
            mockStore.next(currState)
          })
          it("> calls both spies", async () => {
            const pr = Promise.race([
              effect.onRouteUpdate$.pipe(take(1)).toPromise(),
              new Promise(rs => setTimeout(() => {
                rs('food')
              }, 160))
            ])
            mockRouter.events.next(
              new NavigationEnd(1, newRoute, newRoute)
            )
            await pr
            expect(cvtStateToRouteSpy).toHaveBeenCalledOnceWith(currState)
            expect(cvtRouteToStateSpy).toHaveBeenCalledOnceWith(
              mockRouter.parseUrl(newRoute)
            )
          })
          it("> never dispatches", async () => {
            const pr = Promise.race([
              effect.onRouteUpdate$.pipe(take(1)).toPromise(),
              new Promise(rs => setTimeout(() => {
                rs('food')
              }, 160))
            ])
            mockRouter.events.next(
              new NavigationEnd(1, newRoute, newRoute)
            )
            const result = await pr
            expect(result).toEqual("food")
          })
        })
      })

      describe("> custom state is nonempty", () => {
        
      })
    })
  })
})