import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { TestBed } from "@angular/core/testing"
import { provideMockActions } from "@ngrx/effects/testing"
import { Action } from "@ngrx/store"
import { provideMockStore } from "@ngrx/store/testing"
import { Observable, of } from "rxjs"
import { PureContantService } from "src/util"
import { generalApplyState } from "../stateStore.helper"
import { NgViewerUseEffect } from "./ngViewerState.store"

const action$: Observable<Action> = of({ type: 'TEST'})
const initState = {}
describe('> ngViewerState.store.ts', () => {
  describe('> NgViewerUseEffect', () => {
    let ef: NgViewerUseEffect
    beforeEach(() => {

      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
        ],
        providers: [
          provideMockActions(() => action$),
          provideMockStore({ initialState: initState }),
          {
            provide: PureContantService,
            useValue: class {
              useTouchUI$ = of(false)
            }
          }
        ]
      })
    })

    it('> shoudl be insable', () => {
      ef = TestBed.inject(NgViewerUseEffect)
      expect(ef).toBeTruthy()
    })

    describe('> applySavedUserConfig$', () => {

      let ctrl: HttpTestingController
      beforeEach(() => {
        ctrl = TestBed.inject(HttpTestingController)
        ef = TestBed.inject(NgViewerUseEffect)
      })

      afterEach(() => {
        ctrl.verify()
      })
      
      it('> if http response errors, user$ should be stream of null', () => {
        
        ef.applySavedUserConfig$.subscribe(_action => {
          // should not emit
          expect(false).toEqual(true)
        })
        const resp1 = ctrl.expectOne('http://localhost:3000/user/config')
        resp1.error(null, {
          status: 404,
        })
      })

      it('> if http response contains truthy error key, user should return stream of null', () => {

        ef.applySavedUserConfig$.subscribe(_action => {
          // should not emit
          expect(false).toEqual(true)
        })
        const resp = ctrl.expectOne('http://localhost:3000/user/config')
        resp.flush({
          error: true
        })
      })

      it('> if http response does not contain error key, should return the resp', () => {
        
        const mUserState = {
          foo: 'baz',
          baz: 'pineablle'
        }
        ef.applySavedUserConfig$.subscribe(action => {
          expect(action).toEqual(generalApplyState({
            state: {
              ...initState,
              ngViewerState: {
                ...(initState['ngViewerState'] || {}),
                ...mUserState,
              }
            }
          }))
        })
        const resp = ctrl.expectOne('http://localhost:3000/user/config')
        resp.flush({ ngViewerState: mUserState})

      })
    })
  })
})
