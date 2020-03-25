import { TestBed } from "@angular/core/testing";
import { HttpClientModule, HTTP_INTERCEPTORS, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpHeaders } from "@angular/common/http";
import { PluginServiceUseEffect } from "./pluginUseEffect";
import { Observable, of } from "rxjs";
import { Action } from "@ngrx/store";
import { provideMockActions } from "@ngrx/effects/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { defaultRootState } from "../stateStore.service";
import { PLUGINSTORE_CONSTANTS, PLUGINSTORE_ACTION_TYPES } from '../state/pluginState.store'
import { Injectable } from "@angular/core";
import { getRandomHex } from 'common/util'
import { PluginServices } from "src/atlasViewer/pluginUnit";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { hot } from "jasmine-marbles";

const actions$: Observable<Action> = of({type: 'TEST'})

const manifest = {
  name: getRandomHex(),
  templateURL: 'http://localhost:12345/template.html',
  scriptURL: 'http://localhost:12345/script.js'
}

const template = getRandomHex()
const script = getRandomHex()

@Injectable()
class HTTPInterceptorClass implements HttpInterceptor{
  intercept(req: HttpRequest<any>, next: HttpHandler):Observable<HttpEvent<any>>{
    if(req.url.indexOf('http://localhost:12345') >= 0) {
      if (req.url.indexOf('manifest.json') >= 0) {

        const headers = new HttpHeaders()
        headers.set('content-type', 'application/json')
        return of(new HttpResponse({
          status: 200,
          body: manifest,
          headers
        }))
      }

      if (req.url.indexOf('template.html') >= 0) {

        const headers = new HttpHeaders()
        headers.set('content-type', 'text/html')
        return of(new HttpResponse({
          status: 200,
          body: template,
          headers
        }))
      }

      if (req.url.indexOf('script.js') >= 0) {

        const headers = new HttpHeaders()
        headers.set('content-type', 'application/javascript')
        return of(new HttpResponse({
          status: 200,
          body: script,
          headers
        }))
      }
    } 
    return next.handle(req)
  }
}

@Injectable()
class MockPluginService{
  public launchNewWidget(arg) {
    console.log('launch new widget')
  }
}

describe('pluginUseEffect.ts', () => {

  let spy
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        AngularMaterialModule
      ],
      providers: [
        PluginServiceUseEffect,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            ...defaultRootState,
            pluginState:{
              initManifests: [
                [ PLUGINSTORE_CONSTANTS.INIT_MANIFEST_SRC, 'http://localhost:12345/manifest.json' ]
              ]
            }
          }
        }),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HTTPInterceptorClass,
          multi: true
        },
        {
          provide: PluginServices,
          useClass: MockPluginService
        }
      ]
    }).compileComponents()
    const pluginServices = TestBed.get(PluginServices)
    spy = spyOn(pluginServices, 'launchNewWidget')
  })

  it('initManifests should fetch manifest.json', () => {
    const effect = TestBed.get(PluginServiceUseEffect) as PluginServiceUseEffect
    expect(
      effect.initManifests$
    ).toBeObservable(
      hot('a', {
        a: {type: PLUGINSTORE_ACTION_TYPES.CLEAR_INIT_PLUGIN}
      })
    )
    expect(spy).toHaveBeenCalledWith(manifest)
  })
})
