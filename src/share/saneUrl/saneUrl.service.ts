import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { throwError } from "rxjs";
import { catchError, mapTo } from "rxjs/operators";
import { IKeyValStore, NotFoundError } from '../type'
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})

export class SaneUrlSvc implements IKeyValStore{
  public saneUrlRoot = `${environment.BACKEND_URL || ''}go/`
  constructor(
    private http: HttpClient
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
    return this.http.post(
      `${this.saneUrlRoot}${key}`,
      value,
    ).pipe(
      mapTo(`${this.saneUrlRoot}${key}`)
    )
  }
}
