import { Inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { catchError, timeout, map } from "rxjs/operators";
import { of, Observable } from "rxjs";
import { environment } from 'src/environments/environment'
import { IDS } from "src/atlasComponents/sapi/constants"
import { GET_ATTR_TOKEN, GetAttr } from "src/util/constants";
import { CONST } from "common/constants"

type ITemplateCoordXformResp = {
  status: 'pending' | 'error' | 'completed' | 'cached'
  statusText?: string
  result? : [number, number, number]
}

export const VALID_TEMPLATE_SPACE_NAMES = {
  MNI152: 'MNI 152 ICBM 2009c Nonlinear Asymmetric',
  COLIN27: 'MNI Colin 27',
  BIG_BRAIN: 'Big Brain (Histology)',
  INFANT: 'Infant Atlas',
} as const

export type ValidTemplateSpaceName = typeof VALID_TEMPLATE_SPACE_NAMES[keyof typeof VALID_TEMPLATE_SPACE_NAMES]

@Injectable({
  providedIn: 'root',
})
export class InterSpaceCoordXformSvc {

  static TmplIdToValidSpaceName(tmplId: string): ValidTemplateSpaceName{
    switch (tmplId) {
    case IDS.TEMPLATES.BIG_BRAIN: return VALID_TEMPLATE_SPACE_NAMES.BIG_BRAIN
    case IDS.TEMPLATES.MNI152: return VALID_TEMPLATE_SPACE_NAMES.MNI152
    case IDS.TEMPLATES.COLIN27: return VALID_TEMPLATE_SPACE_NAMES.COLIN27
    default: return null
    }
  }

  private cache = {
    _map: new Map<string, [number, number, number]>(),
    _getKey(srcTmplName: ValidTemplateSpaceName, targetTmplName: ValidTemplateSpaceName, coordinatesInNm: [number, number, number]) {
      return `${srcTmplName}:${targetTmplName}:${coordinatesInNm.map(v => Math.round(v / 1e3)).join(',')}`
    },
    set(srcTmplName: ValidTemplateSpaceName, targetTmplName: ValidTemplateSpaceName, coordinatesInNm: [number, number, number], result: [number, number, number]) {
      const key = this._getKey(srcTmplName, targetTmplName, coordinatesInNm)
      return this._map.set(key, result)
    },
    get(srcTmplName: ValidTemplateSpaceName, targetTmplName: ValidTemplateSpaceName, coordinatesInNm: [number, number, number]) {
      const key = this._getKey(srcTmplName, targetTmplName, coordinatesInNm)
      return this._map.get(key)
    }
  }

  constructor(private httpClient: HttpClient, @Inject(GET_ATTR_TOKEN) getAttr: GetAttr) {
    this.url = (getAttr(CONST.OVERWRITE_SPATIAL_BACKEND_ATTR) || environment.SPATIAL_TRANSFORM_BACKEND).replace(/\/$/, '') + '/v1/transform-points'
  }

  private url: string

  // jasmine marble cannot test promise properly
  // see https://github.com/ngrx/platform/issues/498#issuecomment-337465179
  // in order to properly test with marble, use obs instead of promise
  transform(srcTmplName: ValidTemplateSpaceName, targetTmplName: ValidTemplateSpaceName, coordinatesInNm: [number, number, number]): Observable<ITemplateCoordXformResp> {
    if (environment.STRICT_LOCAL) {
      return of({
        status: 'error',
        statusText: 'STRICT_LOCAL mode on, will not transform'
      } as ITemplateCoordXformResp)
    }
    if (!srcTmplName || !targetTmplName) {
      return of({
        status: 'error',
        statusText: 'either srcTmplName or targetTmplName is undefined'
      } as ITemplateCoordXformResp)
    }
    const cachedResult = this.cache.get(srcTmplName, targetTmplName, coordinatesInNm)
    if (cachedResult) {
      return of({
        status: 'cached',
        result: cachedResult,
      } as ITemplateCoordXformResp)
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
      })
    }
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
        const result = resp['target_points'][0].map((r: number)=> r * 1e6) as [number, number, number]
        this.cache.set(srcTmplName, targetTmplName, coordinatesInNm, result)
        return {
          status: 'completed',
          result
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