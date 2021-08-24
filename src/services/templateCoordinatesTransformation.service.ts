import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders, HttpErrorResponse} from "@angular/common/http";
import { catchError, timeout, map } from "rxjs/operators";
import { of, Observable } from "rxjs";
import { environment } from 'src/environments/environment'

export interface ITemplateCoordXformResp{
  status: 'pending' | 'error' | 'completed'
  statusText?: string
  result? : [number, number, number]
}

@Injectable({
  providedIn: 'root',
})
export class TemplateCoordinatesTransformation {

  static VALID_TEMPLATE_SPACE_NAMES = {
    MNI152: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
    COLIN27: 'MNI Colin 27',
    BIG_BRAIN: 'Big Brain (Histology)',
    INFANT: 'Infant Atlas',
  }

  static NameMap = new Map([
    ['MNI152 2009c nonl asym', TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.MNI152],
    ["Big Brain", TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN]
  ])

  constructor(private httpClient: HttpClient) {}

  public url = `${environment.SPATIAL_TRANSFORM_BACKEND.replace(/\/$/, '')}/v1/transform-points`

  // jasmine marble cannot test promise properly
  // see https://github.com/ngrx/platform/issues/498#issuecomment-337465179
  // in order to properly test with marble, use obs instead of promise
  getPointCoordinatesForTemplate(sourceTemplateName: string, targetTemplateName: string, coordinatesInNm: [number, number, number]): Observable<ITemplateCoordXformResp> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    }
    const srcTmplName = Object.values(TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES).includes(sourceTemplateName)
      ? sourceTemplateName
      : TemplateCoordinatesTransformation.NameMap.get(sourceTemplateName)

    const targetTmplName = Object.values(TemplateCoordinatesTransformation.VALID_TEMPLATE_SPACE_NAMES).includes(targetTemplateName)
      ? targetTemplateName
      : TemplateCoordinatesTransformation.NameMap.get(targetTemplateName)
    
    return this.httpClient.post(
      this.url,
      JSON.stringify({
        'source_points': [[...coordinatesInNm.map(c => c/1e6)]],
        'source_space': srcTmplName,
        'target_space': targetTmplName
      }),
      httpOptions
    ).pipe(
      map(resp => {
        return {
          status: 'completed',
          result: resp['target_points'][0].map((r: number)=> r * 1e6)
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