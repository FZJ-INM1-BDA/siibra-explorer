import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders, HttpErrorResponse} from "@angular/common/http";
import { catchError, timeout, map } from "rxjs/operators";
import { of, Observable } from "rxjs";

export interface ITemplateCoordXformResp{
  status: 'pending' | 'error' | 'completed',
  statusText?: string,
  result? : [number, number, number]
}

@Injectable({
  providedIn: 'root',
})
export class TemplateCoordinatesTransformation {

  constructor(private httpClient: HttpClient) {}

  public url = 'https://hbp-spatial-backend.apps-dev.hbp.eu/v1/transform-points'

  // jasmine marble cannot test promise properly
  // see https://github.com/ngrx/platform/issues/498#issuecomment-337465179
  // in order to properly test with marble, use obs instead of promise
  getPointCoordinatesForTemplate(sourceTemplateName: string, targetTemplateName: string, coordinatesInNm: [number, number, number]): Observable<ITemplateCoordXformResp> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    }
    return this.httpClient.post(
      this.url,
      JSON.stringify({
        'source_points': [[...coordinatesInNm.map(c => c/1e6)]],
        'source_space': sourceTemplateName,
        'target_space': targetTemplateName
      }),
      httpOptions
    ).pipe(
      map(resp => {
        return {
          status: 'completed',
          result: resp['target_points'][0].map((r:number)=> r * 1e6)
        } as ITemplateCoordXformResp
      }),
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          return of(({ status: 'error', statusText: err.message } as ITemplateCoordXformResp))
        } else {
          return of(({ status: 'error', statusText: err.toString() } as ITemplateCoordXformResp))
        }
      }),
      timeout(3000),
      catchError(() => of(({ status: 'error', statusText: `Timeout after 3s` } as ITemplateCoordXformResp))),
    )
  }
}