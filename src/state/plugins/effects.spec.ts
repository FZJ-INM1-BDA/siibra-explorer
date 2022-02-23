import { TestBed } from "@angular/core/testing";
import { HttpClientModule, HTTP_INTERCEPTORS, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpHeaders } from "@angular/common/http";
import { Effects } from "./effects";
import { Observable, of } from "rxjs";
import { Action } from "@ngrx/store";
import { provideMockActions } from "@ngrx/effects/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { Injectable } from "@angular/core";
import { getRandomHex } from 'common/util'
import { PluginServices } from "src/plugin";
import { AngularMaterialModule } from "src/sharedModules";
import { hot } from "jasmine-marbles";
import { BS_ENDPOINT } from "src/util/constants";
import * as actions from "./actions"
import { INIT_MANIFEST_SRC } from "./const"

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
        Effects,
        provideMockActions(() => actions$),
        provideMockStore(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HTTPInterceptorClass,
          multi: true
        },
        {
          provide: PluginServices,
          useClass: MockPluginService
        },
        {
          provide: BS_ENDPOINT,
          useValue: `http://localhost:1234`
        }
      ]
    }).compileComponents()
    const pluginServices = TestBed.get(PluginServices)
    spy = spyOn(pluginServices, 'launchNewWidget')
  })

  it('initManifests should fetch manifest.json', () => {
    const effect = TestBed.inject(Effects)
    expect(
      effect.initManClear
    ).toBeObservable(
      hot('a', actions.clearInitManifests({
        nameSpace: INIT_MANIFEST_SRC
      }))
    )
    expect(spy).toHaveBeenCalledWith(manifest)
  })
})
