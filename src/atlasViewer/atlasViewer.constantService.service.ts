import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { SNACKBAR_MESSAGE } from "src/services/state/uiState.store";
import { IavRootStoreInterface } from "../services/stateStore.service";
import { PureContantService } from "src/util";

@Injectable({
  providedIn : 'root',
})

export class AtlasViewerConstantsServices implements OnDestroy {

  public darktheme: boolean = false
  public darktheme$: Observable<boolean>

  public citationToastDuration = 7e3

  /**
   * Timeout can be longer, since configs are lazy loaded.
   */
  private TIMEOUT = 16000

  // instead of using window.location.href, which includes query param etc
  public backendUrl = (BACKEND_URL && `${BACKEND_URL}/`.replace(/\/\/$/, '/')) || `${window.location.origin}${window.location.pathname}`

  public templateUrls = Array(100)

  /* to be provided by KG in future */
  private _mapArray: Array<[string, string[]]> = [
    [ 'JuBrain Cytoarchitectonic Atlas' ,
      [
        'res/json/pmapsAggregatedData.json',
        'res/json/receptorAggregatedData.json',
      ],
    ],
    [
      'Fibre Bundle Atlas - Short Bundle',
      [
        'res/json/swmAggregatedData.json',
      ],
    ],
    [
      'Allen Mouse Common Coordinate Framework v3 2015',
      [
        'res/json/allenAggregated.json',
      ],
    ],
    [
      'Fibre Bundle Atlas - Long Bundle',
      [
        'res/json/dwmAggregatedData.json',
      ],
    ],
    [
      'Whole Brain (v2.0)',
      [
        'res/json/waxholmAggregated.json',
      ],
    ],
  ]

  public mapParcellationNameToFetchUrl: Map<string, string[]> = new Map(this._mapArray)
  public spatialSearchUrl = 'https://kg-int.humanbrainproject.org/solr/'
  public spatialResultsPerPage = 10

  public chartBaseStyle = {
    fill : 'origin',
  }

  public chartSdStyle = {
    fill : false,
    backgroundColor : 'rgba(0,0,0,0)',
    borderDash : [10, 3],
    pointRadius : 0,
    pointHitRadius : 0,
  }

  public minReqMD = `
# Hmm... it seems like we hit a snag
It seems your browser has trouble loading interactive atlas viewer.
Interactive atlas viewer requires **webgl2.0**, and the \`EXT_color_buffer_float\` extension enabled.
- We recommend using _Chrome >= 56_ or _Firefox >= 51_. You can check your browsers' support of webgl2.0 by visiting <https://caniuse.com/#feat=webgl2>
- If you are on _Chrome < 56_ or _Firefox < 51_, you may be able to enable **webgl2.0** by turning on experimental flag <https://get.webgl.org/webgl2/enable.html>.
- If you are on an Android device we recommend _Chrome for Android_ or _Firefox for Android_.
- Unfortunately, Safari and iOS devices currently do not support **webgl2.0**: <https://webkit.org/status/#specification-webgl-2>
`
  public minReqModalHeader = `Hmm... it seems your browser and is having trouble loading interactive atlas viewer`
  public minReqWebGl2 = `Your browser does not support WebGL2.`
  public minReqColorBufferFloat = `Your browser does not support EXT_color_bugger_float extension`

  public mobileWarningHeader = `Power and Network Usage warning`
  public mobileWarning = `It looks like you are on a mobile device. Please note that the atlas viewer is power and network usage intensive.`

  /**
   * When the selected regions becomes exceedingly many, referer header often gets too hard
   * in nginx, it can result in 400 header to large
   * as result, trim referer to only template and parcellation selected
   */
  private getScopedReferer(): string {
    const url = new URL(window.location.href)
    url.searchParams.delete('regionsSelected')
    return url.toString()
  }

  public getHttpHeader(): HttpHeaders {
    const header = new HttpHeaders()
    header.set('referrer', this.getScopedReferer())
    return header
  }

  public getFetchOption(): RequestInit {
    return {
      referrer: this.getScopedReferer(),
    }
  }

  /**
   * message when user on hover a segment or landmark
   */
  public toggleMessage: string = 'double click to toggle select, right click to search'

  /**
   * Observable for showing config modal
   */
  public showConfigTitle: string = 'Settings'

  public incorrectParcellationNameSearchParam(title) {
    return `The selected parcellation - ${title} - is not available. The the first parcellation of the template is selected instead.`
  }

  public incorrectTemplateNameSearchParam(title) {
    return `The selected template - ${title} - is not available.`
  }

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private http: HttpClient,
    private pureConstantService: PureContantService
  ) {

    this.darktheme$ = this.store$.pipe(
      select('viewerState'),
      select('templateSelected'),
      map(template => {
        if (!template) { return false }
        return template.useTheme === 'dark'
      }),
      shareReplay(1),
    )

    this.subscriptions.push(
      this.darktheme$.subscribe(flag => this.darktheme = flag),
    )
    this.pureConstantService.getTemplateEndpoint$.subscribe(arr => {
      this.totalTemplates = arr.length
    })
  }

  private subscriptions: Subscription[] = []

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  public catchError(e: Error | string) {
    this.store$.dispatch({
      type: SNACKBAR_MESSAGE,
      snackbarMessage: e.toString(),
    })
  }

}

export const UNSUPPORTED_PREVIEW = [{
  text: 'Preview of Colin 27 and JuBrain Cytoarchitectonic',
  previewSrc: './res/image/1.png',
}, {
  text: 'Preview of Big Brain 2015 Release',
  previewSrc: './res/image/2.png',
}, {
  text: 'Preview of Waxholm Rat V2.0',
  previewSrc: './res/image/3.png',
}]

export const UNSUPPORTED_INTERVAL = 7000

