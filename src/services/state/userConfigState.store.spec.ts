import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { fakeAsync, TestBed, tick } from "@angular/core/testing"
import { provideMockActions } from "@ngrx/effects/testing"
import { Action } from "@ngrx/store"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { from, Observable } from "rxjs"
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module"
import { PureContantService } from "src/util"
import { DialogService } from "../dialogService.service"
import { actionUpdatePluginCsp, UserConfigStateUseEffect } from "./userConfigState.store"
import { viewerStateSelectedParcellationSelector, viewerStateSelectedRegionsSelector, viewerStateSelectedTemplateSelector } from "./viewerState/selectors"

describe('> userConfigState.store.spec.ts', () => {
  describe('> UserConfigStateUseEffect', () => {
    let action$: Observable<Action>
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          AngularMaterialModule,
        ],
        providers: [
          provideMockActions(() => action$),
          provideMockStore({
            initialState: {
              viewerConfigState: {
                gpuLimit: 1e9,
                animation: true
              }
            }
          }),
          DialogService,
          {
            provide: PureContantService,
            useValue: {
              backendUrl: 'http://localhost:3000/'
            }
          }
        ]
      })

      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateSelectedTemplateSelector, null)
      mockStore.overrideSelector(viewerStateSelectedParcellationSelector, null)
      mockStore.overrideSelector(viewerStateSelectedRegionsSelector, [])
    })

    it('> can be init', () => {
      const useEffect = TestBed.inject(UserConfigStateUseEffect)
      expect(useEffect).toBeTruthy()
    })
    describe('> setInitPluginPermission$', () => {
      let mockHttp: HttpTestingController
      let useEffect: UserConfigStateUseEffect
      const mockpluginPer = {
        'foo-bar': {
          'script-src': [
            '1',
            '2',
          ]
        }
      }
      beforeEach(() => {
        mockHttp = TestBed.inject(HttpTestingController)
        useEffect = TestBed.inject(UserConfigStateUseEffect)
      })
      afterEach(() => {
        mockHttp.verify()
      })
      it('> calls /GET user/pluginPermissions', fakeAsync(() => {
        let val
        useEffect.setInitPluginPermission$.subscribe(v => val = v)
        tick(20)
        const req = mockHttp.expectOne(`http://localhost:3000/user/pluginPermissions`)
        req.flush(mockpluginPer)
        expect(val).toEqual(actionUpdatePluginCsp({ payload: mockpluginPer }))
      }))

      it('> if get fn fails', fakeAsync(() => {
        let val
        useEffect.setInitPluginPermission$.subscribe(v => val = v)
        const req = mockHttp.expectOne(`http://localhost:3000/user/pluginPermissions`)
        req.error(null, { status: 500, statusText: 'Internal Error' })
        expect(val).toEqual(actionUpdatePluginCsp({ payload: {} }))
      }))
    })
  })
})