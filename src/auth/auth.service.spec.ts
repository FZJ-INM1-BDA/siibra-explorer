import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { APP_INITIALIZER } from "@angular/core"
import { TestBed } from "@angular/core/testing"
import { hot } from "jasmine-marbles"
import { AuthService } from "./auth.service"

describe('>auth.service.ts', () => {
  describe('> AuthService', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule
        ],
        providers: [
          AuthService,
          {
            provide: APP_INITIALIZER,
            useFactory: (authSvc: AuthService) => {
              authSvc.authReloadState()
              return () => Promise.resolve()
            },
            multi: true,
            deps: [ AuthService ]
          }
        ]
      })
    })

    describe('> user$', () => {
      let ctrl: HttpTestingController
      let authService: AuthService

      afterEach(() => {
        ctrl.verify()
      })
      beforeEach(() => {

        ctrl = TestBed.inject(HttpTestingController)
        authService = TestBed.inject(AuthService)
      })

      it('> if http response errors, user$ should be stream of null', () => {

        const resp = ctrl.expectOne('user')
        resp.error(null, {
          status: 404,
        })
        expect(
          authService.user$
        ).toBeObservable(
          hot('(a|)', {
            a: null
          })
        )
      })

      it('> if http response contains truthy error key, user should return stream of null', () => {

        const resp = ctrl.expectOne('user')
        resp.flush({
          error: true
        })
        expect(
          authService.user$
        ).toBeObservable(
          hot('(a|)', {
            a: null
          })
        )
      })

      it('> if http response does not contain error key, should return the resp', () => {
        
        const mockUser = {
          name: 'foobar',
          id: 'baz'
        }
        const resp = ctrl.expectOne('user')
        resp.flush(mockUser)

        expect(
          authService.user$
        ).toBeObservable(
          hot('(a|)', {
            a: mockUser
          })
        )
      })
    })
  })
})
