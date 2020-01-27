import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { merge, Observable, of, Subscription, throwError, fromEvent, forkJoin } from "rxjs";
import { catchError, map, shareReplay, switchMap, tap, filter, take } from "rxjs/operators";
import { LoggingService } from "src/services/logging.service";
import { SNACKBAR_MESSAGE } from "src/services/state/uiState.store";
import { IavRootStoreInterface } from "../services/stateStore.service";
import { AtlasWorkerService } from "./atlasViewer.workerService.service";

export const CM_THRESHOLD = `0.05`
export const CM_MATLAB_JET = `float r;if( x < 0.7 ){r = 4.0 * x - 1.5;} else {r = -4.0 * x + 4.5;}float g;if (x < 0.5) {g = 4.0 * x - 0.5;} else {g = -4.0 * x + 3.5;}float b;if (x < 0.3) {b = 4.0 * x + 0.5;} else {b = -4.0 * x + 2.5;}float a = 1.0;`
export const GLSL_COLORMAP_JET = `void main(){float x = toNormalized(getDataValue());${CM_MATLAB_JET}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`

const getUniqueId = () => Math.round(Math.random() * 1e16).toString(16)

@Injectable({
  providedIn : 'root',
})

export class AtlasViewerConstantsServices implements OnDestroy {

  public darktheme: boolean = false
  public darktheme$: Observable<boolean>

  public useMobileUI$: Observable<boolean>
  public loadExportNehubaPromise: Promise<boolean>

  public ngLandmarkLayerName = 'spatial landmark layer'
  public ngUserLandmarkLayerName = 'user landmark layer'

  public citationToastDuration = 7e3

  /**
   * optimized for nehubaConfig.layout.useNehubaPerspective.fixedZoomPerspectiveSlices
   *  sliceZoom
   *  sliceViewportWidth
   *  sliceViewportHeight
   */
  public nehubaLandmarkConstant = 1e-8

  /**
   * Timeout can be longer, since configs are lazy loaded.
   */
  private TIMEOUT = 16000

  /* TODO to be replaced by @id: Landmark/UNIQUE_ID in KG in the future */
  public testLandmarksChanged: (prevLandmarks: any[], newLandmarks: any[]) => boolean = (prevLandmarks: any[], newLandmarks: any[]) => {
    return prevLandmarks.every(lm => typeof lm.name !== 'undefined') &&
      newLandmarks.every(lm => typeof lm.name !== 'undefined') &&
      prevLandmarks.length === newLandmarks.length
  }

  // instead of using window.location.href, which includes query param etc
  public backendUrl = `${BACKEND_URL}/`.replace(/\/\/$/, '/') || `${window.location.origin}${window.location.pathname}`

  private fetchTemplate = (templateUrl) => this.http.get(`${this.backendUrl}${templateUrl}`, { responseType: 'json' }).pipe(
    switchMap((template: any) => {
      if (template.nehubaConfig) { return of(template) }
      if (template.nehubaConfigURL) { return this.http.get(`${this.backendUrl}${template.nehubaConfigURL}`, { responseType: 'json' }).pipe(
        map(nehubaConfig => {
          return {
            ...template,
            nehubaConfig,
          }
        }),
      )
      }
      throwError('neither nehubaConfig nor nehubaConfigURL defined')
    }),
  )

  public totalTemplates = null

  private workerUpdateParcellation$ = fromEvent(this.workerService.worker, 'message').pipe(
    filter((message: MessageEvent) => message && message.data && message.data.type === 'UPDATE_PARCELLATION_REGIONS'),
    map(({ data }) => data)
  )

  private processTemplate = template => forkJoin(
    ...template.parcellations.map(parcellation => {

      const id = getUniqueId()

      this.workerService.worker.postMessage({
        type: 'PROPAGATE_PARC_REGION_ATTR',
        parcellation,
        inheritAttrsOpts: {
          ngId: (parcellation as any ).ngId,
          relatedAreas: [],
          fullId: null
        },
        id
      })

      return this.workerUpdateParcellation$.pipe(
        filter(({ id: returnedId }) => id === returnedId),
        take(1),
        map(({ parcellation }) => parcellation)
      )
    })
  )

  public initFetchTemplate$ = this.http.get(`${this.backendUrl}templates`, { responseType: 'json' }).pipe(
    tap((arr: any[]) => this.totalTemplates = arr.length),
    switchMap((templates: string[]) => merge(
      ...templates.map(templateName => this.fetchTemplate(templateName).pipe(
        switchMap(template => this.processTemplate(template).pipe(
          map(parcellations => {
            return {
              ...template,
              parcellations
            }
          })
        ))
      )),
    )),
    catchError((err) => {
      this.log.warn(`fetching templates error`, err)
      return of(null)
    }),
  )

  /* to be provided by KG in future */
  public templateUrlsPr: Promise<string[]> = new Promise((resolve, reject) => {
    fetch(`${this.backendUrl}templates`, this.getFetchOption())
      .then(res => res.json())
      .then(arr => {
        this.templateUrls = arr
        return arr
      })
      .then(resolve)
      .catch(reject)
  })

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
  public spatialWidth = 600

  public landmarkFlatProjection: boolean = false

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

  public minReqExplaner = `
  - Interactive atlas viewer requires **webgl2.0**, and the \`EXT_color_buffer_float\` extension enabled.
  - You can check browsers' support of webgl2.0 by visiting <https://caniuse.com/#feat=webgl2>
  - Unfortunately, Safari and iOS devices currently do not support **webgl2.0**: <https://webkit.org/status/#specification-webgl-2>
  `

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

  public getFetchOption(): RequestInit {
    return {
      referrer: this.getScopedReferer(),
    }
  }

  get floatingWidgetStartingPos(): [number, number] {
    return [400, 100]
  }

  /**
   * message when user on hover a segment or landmark
   */
  public toggleMessage: string = 'double click to toggle select, right click to search'

  /**
   * Observable for showing config modal
   */
  public showConfigTitle: string = 'Settings'

  private showHelpGeneralMobile = [
    ['hold 🌏 + ↕', 'change oblique slice mode'],
    ['hold 🌏 + ↔', 'oblique slice'],
  ]
  private showHelpGeneralDesktop = [
    ['num keys [0-9]', 'toggle layer visibility [0-9]'],
    ['h', 'show help'],
    ['?', 'show help'],
    ['o', 'toggle perspective/orthographic'],
  ]

  public showHelpGeneralMap = this.showHelpGeneralDesktop

  private showHelpSliceViewMobile = [
    ['drag', 'pan'],
  ]
  private showHelpSliceViewDesktop = [
    ['drag', 'pan'],
    ['shift + drag', 'oblique slice'],
  ]

  public showHelpSliceViewMap = this.showHelpSliceViewDesktop

  private showHelpPerspectiveMobile = [
    ['drag', 'change perspective view'],
  ]

  private showHelpPerspectiveDesktop = [
    ['drag', 'change perspective view'],
  ]
  public showHelpPerspectiveViewMap = this.showHelpPerspectiveDesktop

  /**
   * raise/track issues at github repo: <a target = "_blank" href = "${this.repoUrl}">${this.repoUrl}</a>
   */

  public supportEmailAddress = `inm1-bda@fz-juelich.de`

  public showHelpSupportText: string = `Did you encounter an issue?
Send us an email: <a target = "_blank" href = "mailto:${this.supportEmailAddress}">${this.supportEmailAddress}</a>`

  public incorrectParcellationNameSearchParam(title) {
    return `The selected parcellation - ${title} - is not available. The the first parcellation of the template is selected instead.`
  }

  public incorrectTemplateNameSearchParam(title) {
    return `The selected template - ${title} - is not available.`
  }

  private repoUrl = `https://github.com/HumanBrainProject/interactive-viewer`

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private http: HttpClient,
    private log: LoggingService,
    private workerService: AtlasWorkerService
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

    this.useMobileUI$ = this.store$.pipe(
      select('viewerConfigState'),
      select('useMobileUI'),
      shareReplay(1),
    )

    this.subscriptions.push(
      this.darktheme$.subscribe(flag => this.darktheme = flag),
    )

    this.subscriptions.push(
      this.useMobileUI$.subscribe(bool => {
        if (bool) {
          this.showHelpSliceViewMap = this.showHelpSliceViewMobile
          this.showHelpGeneralMap = this.showHelpGeneralMobile
          this.showHelpPerspectiveViewMap = this.showHelpPerspectiveMobile
          this.dissmissUserLayerSnackbarMessage = this.dissmissUserLayerSnackbarMessageMobile
        } else {
          this.showHelpSliceViewMap = this.showHelpSliceViewDesktop
          this.showHelpGeneralMap = this.showHelpGeneralDesktop
          this.showHelpPerspectiveViewMap = this.showHelpPerspectiveDesktop
          this.dissmissUserLayerSnackbarMessage = this.dissmissUserLayerSnackbarMessageDesktop
        }
      }),
    )
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

  public cyclePanelMessage: string = `[spacebar] to cycle through views`

  private dissmissUserLayerSnackbarMessageDesktop = `You can dismiss extra layers with [ESC]`
  private dissmissUserLayerSnackbarMessageMobile = `You can dismiss extra layers in the 🌏 menu`
  public dissmissUserLayerSnackbarMessage: string = this.dissmissUserLayerSnackbarMessageDesktop
}

const parseURLToElement = (url: string): HTMLElement => {
  const el = document.createElement('script')
  el.setAttribute('crossorigin', 'true')
  el.src = url
  return el
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

export const SUPPORT_LIBRARY_MAP: Map<string, HTMLElement> = new Map([
  ['jquery@3', parseURLToElement('https://code.jquery.com/jquery-3.3.1.min.js')],
  ['jquery@2', parseURLToElement('https://code.jquery.com/jquery-2.2.4.min.js')],
  ['webcomponentsLite@1.1.0', parseURLToElement('https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.1.0/webcomponents-lite.js')],
  ['react@16', parseURLToElement('https://unpkg.com/react@16/umd/react.development.js')],
  ['reactdom@16', parseURLToElement('https://unpkg.com/react-dom@16/umd/react-dom.development.js')],
  ['vue@2.5.16', parseURLToElement('https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.js')],
  ['preact@8.4.2', parseURLToElement('https://cdn.jsdelivr.net/npm/preact@8.4.2/dist/preact.min.js')],
  ['d3@5.7.0', parseURLToElement('https://cdnjs.cloudflare.com/ajax/libs/d3/5.7.0/d3.min.js')],
])

/**
 * First attempt at encoding int (e.g. selected region, navigation location) from number (loc info density) to b64 (higher info density)
 * The constraint is that the cipher needs to be commpatible with URI encoding
 * and a URI compatible separator is required.
 *
 * The implementation below came from
 * https://stackoverflow.com/a/6573119/6059235
 *
 * While a faster solution exist in the same post, this operation is expected to be done:
 * - once per 1 sec frequency
 * - on < 1000 numbers
 *
 * So performance is not really that important (Also, need to learn bitwise operation)
 */

const cipher = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-'
export const separator = "."
const negString = '~'

const encodeInt = (number: number) => {
  if (number % 1 !== 0) { throw new Error('cannot encodeInt on a float. Ensure float flag is set') }
  if (isNaN(Number(number)) || number === null || number === Number.POSITIVE_INFINITY) { throw new Error('The input is not valid') }

  let rixit // like 'digit', only in some non-decimal radix
  let residual
  let result = ''

  if (number < 0) {
    result += negString
    residual = Math.floor(number * -1)
  } else {
    residual = Math.floor(number)
  }

  /* eslint-disable-next-line no-constant-condition */
  while (true) {
    rixit = residual % 64
    // this.log.log("rixit : " + rixit)
    // this.log.log("result before : " + result)
    result = cipher.charAt(rixit) + result
    // this.log.log("result after : " + result)
    // this.log.log("residual before : " + residual)
    residual = Math.floor(residual / 64)
    // this.log.log("residual after : " + residual)

    if (residual === 0) {
      break;
    }
  }
  return result
}

interface IB64EncodingOption {
  float: boolean
}

const defaultB64EncodingOption = {
  float: false,
}

export const encodeNumber:
  (number: number, option?: IB64EncodingOption) => string =
  (number: number, { float = false }: IB64EncodingOption = defaultB64EncodingOption) => {
    if (!float) { return encodeInt(number) } else {
      const floatArray = new Float32Array(1)
      floatArray[0] = number
      const intArray = new Uint32Array(floatArray.buffer)
      const castedInt = intArray[0]
      return encodeInt(castedInt)
    }
  }

const decodetoInt = (encodedString: string) => {
  let _encodedString
  let negFlag = false
  if (encodedString.slice(-1) === negString) {
    negFlag = true
    _encodedString = encodedString.slice(0, -1)
  } else {
    _encodedString = encodedString
  }
  return (negFlag ? -1 : 1) * [..._encodedString].reduce((acc, curr) => {
    const index = cipher.indexOf(curr)
    if (index < 0) { throw new Error(`Poisoned b64 encoding ${encodedString}`) }
    return acc * 64 + index
  }, 0)
}

export const decodeToNumber:
  (encodedString: string, option?: IB64EncodingOption) => number =
  (encodedString: string, {float = false} = defaultB64EncodingOption) => {
    if (!float) { return decodetoInt(encodedString) } else {
      const _int = decodetoInt(encodedString)
      const intArray = new Uint32Array(1)
      intArray[0] = _int
      const castedFloat = new Float32Array(intArray.buffer)
      return castedFloat[0]
    }
  }
