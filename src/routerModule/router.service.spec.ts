import { TestBed } from "@angular/core/testing"
import { DefaultUrlSerializer, NavigationEnd, Router } from "@angular/router"
import { hot } from "jasmine-marbles"
import { of, Subject } from "rxjs"
import { SAPI } from "src/atlasComponents/sapi"
import { RouterService } from "./router.service"
import * as util from './util'
import { provideMockStore } from "@ngrx/store/testing"

const { DummyCmp } = util

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

      TestBed.configureTestingModule({
        imports: [],
        declarations: [
          DummyCmp,
        ],
        providers: [
          provideMockStore(),
          {
            provide: SAPI,
            useValue: {
              atlases$: of(['foo'])
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
      mockRouter.navigateByUrl.calls.reset()
      mockRouter.navigate.calls.reset()
    })

    describe('> customRoute$', () => {
      let decodeCustomStateSpy: jasmine.Spy

      let rService: RouterService
      beforeEach(() => {
        decodeCustomStateSpy = jasmine.createSpy('decodeCustomState')
        spyOnProperty(util, 'decodeCustomState').and.returnValue(decodeCustomStateSpy)
      })

      afterEach(() => {
        decodeCustomStateSpy.calls.reset()
      })

      describe("> state has custom state encoded", () => {
        const stateCustomState = {
          'x-foo': 'bar'
        }
        beforeEach(() => {
          decodeCustomStateSpy.and.returnValue(stateCustomState)
          rService = TestBed.inject(RouterService)
          mockRouter.events.next(
            new NavigationEnd(0, '/', '/')
          )
        })

        describe("> setCustomRoute is called", () => {
          beforeEach(() => {
            rService.setCustomRoute('x-fizz', 'buzz')
          })

          it("> merges from both sources", () => {
            expect(rService.customRoute$).toBeObservable(
              hot('(ba)', {
                a: {
                  'x-fizz': 'buzz',
                  'x-foo': 'bar'
                },
                b: {
                  'x-foo': 'bar'
                },
                z: {
                  'x-fizz': 'buzz'
                }
              })
            )
          })
        })

        describe("> setCustomRoute is not called", () => {
          it("> emits from navigation", () => {
            expect(rService.customRoute$).toBeObservable(
              hot('(b)', {
                a: {
                  'x-fizz': 'buzz',
                  'x-foo': 'bar'
                },
                b: {
                  'x-foo': 'bar'
                },
                z: {
                  'x-fizz': 'buzz'
                }
              })
            )
          })
        })
      })

      describe("> state has no custom state encoded", () => {
        beforeEach(() => {
          decodeCustomStateSpy.and.returnValue({})
          rService = TestBed.inject(RouterService)
          mockRouter.events.next(
            new NavigationEnd(0, '/', '/')
          )
        })
        describe("> setCustomRoute is called", () => {
          beforeEach(() => {
            rService.setCustomRoute('x-fizz', 'buzz')
          })
          it("> emits what is called by setCustomRoute", () => {
            expect(rService.customRoute$).toBeObservable(
              hot('(cz)', {
                a: {
                  'x-fizz': 'buzz',
                  'x-foo': 'bar'
                },
                b: {
                  'x-foo': 'bar'
                },
                c: {},
                z: {
                  'x-fizz': 'buzz'
                }
              })
            )
          })
        })
        
        it('> subsequent emits overwrites', () => {
          decodeCustomStateSpy.and.returnValue({})

          const customRouteSpy = jasmine.createSpy('customRouteSpy')
          rService.customRoute$.subscribe(customRouteSpy)
          
          rService.setCustomRoute('x-fizz', 'buzz')
          rService.setCustomRoute('x-foo', 'bar')
          rService.setCustomRoute('x-foo', null)


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
        })
      })
      
    })
  })
})
