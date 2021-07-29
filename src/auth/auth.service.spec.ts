import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { TestBed } from "@angular/core/testing"
import { hot } from "jasmine-marbles"
import { PureContantService } from "src/util"
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
            provide: PureContantService,
            useValue: {
              backendUrl: `http://localhost:3000/`
            }
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

        const resp = ctrl.expectOne('http://localhost:3000/user')
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

        const resp = ctrl.expectOne('http://localhost:3000/user')
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
        const resp = ctrl.expectOne('http://localhost:3000/user')
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
