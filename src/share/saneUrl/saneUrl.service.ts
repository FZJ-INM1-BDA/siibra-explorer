import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { throwError } from "rxjs";
import { catchError, mapTo } from "rxjs/operators";
import { BACKENDURL } from 'src/util/constants'
import { IKeyValStore, NotFoundError } from '../type'

@Injectable({
  providedIn: 'root'
})

export class SaneUrlSvc implements IKeyValStore{
  public saneUrlRoot = `${BACKENDURL}go/`
  constructor(
    private http: HttpClient
  ){
    if (!BACKENDURL) {
      const loc = window.location
      this.saneUrlRoot = `${loc.protocol}//${loc.hostname}${!!loc.port ? (':' + loc.port) : ''}${loc.pathname}go/`
    }
  }

  getKeyVal(key: string) {
    return this.http.get<Record<string, any>>(
      `${this.saneUrlRoot}${key}`,
      { responseType: 'json' }
    ).pipe(
      catchError((err, obs) => {
        const { status } = err
        if (status === 404) {
          return throwError(new NotFoundError('Not found'))
        }
        return throwError(err)
      })
    )
  }

  setKeyVal(key: string, value: any) {
    return this.http.post(
      `${this.saneUrlRoot}${key}`,
      value,
    ).pipe(
      mapTo(`${this.saneUrlRoot}${key}`)
    )
  }
}
