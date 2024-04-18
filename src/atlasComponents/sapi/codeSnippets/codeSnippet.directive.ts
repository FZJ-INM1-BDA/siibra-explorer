import { Directive, HostListener, Input } from "@angular/core";
import { RouteParam, SapiRoute } from "../typeV3";
import { SAPI } from "../sapi.service";
import { BehaviorSubject, from, of } from "rxjs";
import { switchMap, take } from "rxjs/operators";
import { MatDialog } from "src/sharedModules"
import { CodeSnippetCmp } from "./codeSnippet.dialog";

type V<T extends SapiRoute> = {route: T, param: RouteParam<T>}

@Directive({
  selector: '[code-snippet]',
  standalone: true,
  exportAs: "codeSnippet"
})

export class CodeSnippet<T extends SapiRoute>{

  code$ = this.sapi.sapiEndpoint$.pipe(
    switchMap(endpt => this.#path.pipe(
      switchMap(path => {
        if (!path) {
          return of(null)
        }
        return from(this.#getCode(`${endpt}${path}`))
      })
    )),
  )

  #busy$ = new BehaviorSubject<boolean>(false)
  busy$ = this.#busy$.asObservable()

  @HostListener("click")
  async handleClick(){
    this.#busy$.next(true)
    const code = await this.code$.pipe(
      take(1)
    ).toPromise()
    this.#busy$.next(false)
    this.matDialog.open(CodeSnippetCmp, {
      data: { code }
    })
  }

  @Input()
  set routeParam(value: V<T>|null|undefined){
    if (!value) {
      return
    }
    const { param, route } = value
    const { params, path } = this.sapi.v3GetRoute(route, param)
    
    let url = encodeURI(path)
    const queryParam = new URLSearchParams()
    for (const key in params) {
      queryParam.set(key, params[key].toString())
    }
    const result = `${url}?${queryParam.toString()}`
    this.#path.next(result)
  }

  @Input()
  set path(value: string) {
    this.#path.next(value)
  }
  #path = new BehaviorSubject<string>(null)

  constructor(private sapi: SAPI, private matDialog: MatDialog){}

  async #getCode(url: string): Promise<string> {
    try {
      const resp = await fetch(url, {
        headers: {
          Accept: `text/x-sapi-python`
        }
      })
      if (!resp.ok){
        console.warn(`${url} returned not ok`)
        return null
      }
      const result = await resp.text()
      return result
    } catch (e) {
      console.warn(`Error: ${e}`)
      return null
    }
  }
}
