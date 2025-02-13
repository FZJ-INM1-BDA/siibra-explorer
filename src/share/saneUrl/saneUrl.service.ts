import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { throwError } from "rxjs";
import { catchError, mapTo, switchMap, take } from "rxjs/operators";
import { IKeyValStore, NotFoundError } from '../type'
import { environment } from "src/environments/environment";
import { AuthService } from "src/auth";

@Injectable({
  providedIn: 'root'
})

export class SaneUrlSvc implements IKeyValStore {

  #backendUrl = (() => {
    if (environment.BACKEND_URL) {
      return environment.BACKEND_URL.replace(/\/$/, '')
    }
    const url = new URL(window.location.href)
    const { protocol, hostname, pathname, port } = url
    const maybePort = port ? `:${port}` : ''
    return `${protocol}//${hostname}${pathname.replace(/\/$/, '')}${maybePort}`
  })()

  public saneUrlRoot = `${this.#backendUrl}/go/`

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ){
  }

  getKeyVal(key: string) {
    return this.http.get<Record<string, any>>(
      `${this.saneUrlRoot}${key}`,
      { responseType: 'json' }
    ).pipe(
      catchError((err) => {
        const { status } = err
        if (status === 404) {
          return throwError(new NotFoundError('Not found'))
        }
        return throwError(err)
      })
    )
  }

  setKeyVal(key: string, value: any) {
    return this.auth.user$.pipe(
      take(1),
      switchMap(user => this.http.post(
        `${this.saneUrlRoot}${key}`,
        value,
        {
          headers: {
            "x-sxplr-auth-state": user ? 'true': 'false'
          }
        }
      ).pipe(
        mapTo(`${this.saneUrlRoot}${key}`)
      ))
    )
  }
}
