import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { ViewerStateInterface, Property, FETCHED_METADATA } from "../services/stateStore.service";
import { Subject } from "rxjs";
import { ACTION_TYPES, ViewerConfiguration } from 'src/services/state/viewerConfig.store'

export const CM_THRESHOLD = `0.05`
export const CM_MATLAB_JET = `float r;if( x < 0.7 ){r = 4.0 * x - 1.5;} else {r = -4.0 * x + 4.5;}float g;if (x < 0.5) {g = 4.0 * x - 0.5;} else {g = -4.0 * x + 3.5;}float b;if (x < 0.3) {b = 4.0 * x + 0.5;} else {b = -4.0 * x + 2.5;}float a = 1.0;`

@Injectable({
  providedIn : 'root'
})

export class AtlasViewerConstantsServices{

  public darktheme: boolean = false
  public mobile: boolean
  public loadExportNehubaPromise : Promise<boolean>

  public getActiveColorMapFragmentMain = ():string=>`void main(){float x = toNormalized(getDataValue());${CM_MATLAB_JET}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`

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

  /**
   * raceFetch 
   */
   public raceFetch = (url) => Promise.race([
     fetch(url),
     new Promise((_, reject) => setTimeout(() => {
      reject(`fetch did not resolve under ${this.TIMEOUT} ms`)
     }, this.TIMEOUT)) as Promise<Response>
   ])

  /* TODO to be replaced by @id: Landmark/UNIQUE_ID in KG in the future */
  public testLandmarksChanged : (prevLandmarks : any[], newLandmarks : any[]) => boolean = (prevLandmarks:any[], newLandmarks:any[]) => {
    return prevLandmarks.every(lm => typeof lm.name !== 'undefined') && 
      newLandmarks.every(lm => typeof lm.name !== 'undefined') && 
      prevLandmarks.length === newLandmarks.length
  }

  public backendUrl = BACKEND_URL

  /* to be provided by KG in future */
  public templateUrlsPr : Promise<string[]> = new Promise((resolve, reject) => {
    fetch(`${this.backendUrl}templates`)
      .then(res => res.json())
      .then(arr => {
        this.templateUrls = arr
        return arr
      })
      .then(resolve)
      .catch(reject)
  })

  public templateUrls = Array(100)

  private _templateUrls = [
    // 'res/json/infant.json',
    'res/json/bigbrain.json',
    'res/json/colin.json',
    'res/json/MNI152.json',
    'res/json/waxholmRatV2_0.json',
    'res/json/allenMouse.json',
    // 'res/json/test.json'
  ]

  /* to be provided by KG in future */
  private _mapArray : [string,string[]][] = [
    [ 'JuBrain Cytoarchitectonic Atlas' ,  
      [
        'res/json/pmapsAggregatedData.json',
        'res/json/receptorAggregatedData.json'
      ]
    ],
    [
      'Fibre Bundle Atlas - Short Bundle',
      [
        'res/json/swmAggregatedData.json'
      ]
    ],
    [
      'Allen adult mouse brain reference atlas V3 Brain Atlas',
      [
        'res/json/allenAggregated.json'
      ]
    ],
    [
      'Fibre Bundle Atlas - Long Bundle',
      [
        'res/json/dwmAggregatedData.json'
      ]
    ],
    [
      'Whole Brain (v2.0)',
      [
        'res/json/waxholmAggregated.json'
      ]
    ]
  ]

  public mapParcellationNameToFetchUrl : Map<string,string[]> = new Map(this._mapArray)
  public spatialSearchUrl = 'https://kg-int.humanbrainproject.org/solr/'
  public spatialResultsPerPage = 10
  public spatialWidth = 600

  public landmarkFlatProjection : boolean = false

  public chartBaseStyle = {
    fill : 'origin'
  }

  public chartSdStyle = {
    fill : false,
    backgroundColor : 'rgba(0,0,0,0)',
    borderDash : [10,3],
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

  get floatingWidgetStartingPos() : [number,number]{
    return [400,100]
  } 

  /**
   * message when user on hover a segment or landmark
   */
  public toggleMessage: string = 'double click to toggle select'

  /**
   * observable for showing login modal
   */
  public showSigninSubject$: Subject<any> = new Subject()

  /**
   * Observable for showing config modal
   */
  public showConfigSubject$: Subject<null> = new Subject()
  public showConfigTitle: String = 'Settings'
  /**
   * Observable for showing help modal
   */
  public showHelpSubject$: Subject<null> = new Subject()
  public showHelpTitle: String = 'Help: Controls and Shortcuts'

  private showHelpGeneralMobile = [
    ['hold 🌏 + ↕', 'change oblique slice mode'],
    ['hold 🌏 + ↔', 'oblique slice']
  ]
  private showHelpGeneralDesktop = [
    ['num keys [0-9]', 'toggle layer visibility [0-9]'],
    ['h', 'show help'],
    ['?', 'show help'],
    ['o', 'toggle perspective/orthographic']
  ] 
  get showHelpGeneralMap() {
    return this.mobile
      ? this.showHelpGeneralMobile
      : this.showHelpGeneralDesktop
  }

  private showHelpSliceViewMobile = [
    ['drag', 'pan']
  ]
  private showHelpSliceViewDesktop = [
    ['drag', 'pan'],
    ['shift + drag', 'oblique slice']
  ]
  get showHelpSliceViewMap() {
    return this.mobile
      ? this.showHelpSliceViewMobile
      : this.showHelpSliceViewDesktop
  }

  private showHelpPerspectiveMobile = [
    ['drag', 'change perspective view']
  ]
  
  private showHelpPerspectiveDesktop = [
    ['drag', 'change perspective view']
  ]
  get showHelpPerspectiveViewMap() {
    return this.mobile
      ? this.showHelpPerspectiveMobile
      : this.showHelpPerspectiveDesktop
  }

  get showHelpSupportText() {
    return `Did you encounter an issue? 
      Send us an email: <a target = "_blank" href = "mailto:${this.supportEmailAddress}">${this.supportEmailAddress}</a>, 
      raise/track issues at github repo: <a target = "_blank" href = "${this.repoUrl}">${this.repoUrl}</a>`
  }

  incorrectParcellationNameSearchParam(title) {
    return `The selected parcellation - ${title} - is not available. The the first parcellation of the template is selected instead.`
  }

  incorrectTemplateNameSearchParam(title) {
    return `The selected template - ${title} - is not available.`
  }

  private supportEmailAddress = `x.gui@fz-juelich.de`
  private repoUrl = `https://github.com/HumanBrainProject/interactive-viewer`

  constructor(private store : Store<ViewerStateInterface>){

    const ua = window && window.navigator && window.navigator.userAgent
      ? window.navigator.userAgent
      : ''

    /* https://stackoverflow.com/a/25394023/6059235 */
    this.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)

    /**
     * set gpu limit if user is on mobile
     */
    if (this.mobile) {
      this.store.dispatch({
        type: ACTION_TYPES.UPDATE_CONFIG,
        config: {
          gpuLimit: 2e8
        } as Partial<ViewerConfiguration>
      })  
    }

    const meta = 'res/json/allAggregatedData.json'
  
    fetch(meta)
      .then(res=>res.json())
      .then(metadata=>{
        const data = metadata.reduce((acc:[string,Map<string,{properties:Property}>][],curr:any)=>{
          const idx = acc.findIndex((it)=>it[0]===curr[0].targetParcellation)
          return idx >= 0 ? 
            acc.map((it,i)=> i === idx ? [it[0], it[1].set(curr[0].datasetName,curr[1])] : it ) :
            acc.concat([[ curr[0].targetParcellation , new Map([[curr[0].datasetName , curr[1]]]) ]])
              
              /* [[ curr[0].targetParcellation , [ curr[0].datasetName , curr[1]] ]] */
        },[] as [string,Map<string,{properties:Property}>][])
        
        this.store.dispatch({
          type : FETCHED_METADATA,
          fetchedMetadataMap : new Map(data)
        })
        
      })
      .catch(console.error)
  }
}

const parseURLToElement = (url:string):HTMLElement=>{
  const el = document.createElement('script')
  el.setAttribute('crossorigin','true')
  el.src = url
  return el
}

export const UNSUPPORTED_PREVIEW = [{
  text: 'Preview of Colin 27 and JuBrain Cytoarchitectonic',
  previewSrc: './res/image/1.png'
},{
  text: 'Preview of Big Brain 2015 Release',
  previewSrc: './res/image/2.png'
},{
  text: 'Preview of Waxholm Rat V2.0',
  previewSrc: './res/image/3.png'
}]

export const UNSUPPORTED_INTERVAL = 7000

export const SUPPORT_LIBRARY_MAP : Map<string,HTMLElement> = new Map([
  ['jquery@3',parseURLToElement('http://code.jquery.com/jquery-3.3.1.min.js')],
  ['jquery@2',parseURLToElement('http://code.jquery.com/jquery-2.2.4.min.js')],
  ['webcomponentsLite@1.1.0',parseURLToElement('https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.1.0/webcomponents-lite.js')],
  ['react@16',parseURLToElement('https://unpkg.com/react@16/umd/react.development.js')],
  ['reactdom@16',parseURLToElement('https://unpkg.com/react-dom@16/umd/react-dom.development.js')],
  ['vue@2.5.16',parseURLToElement('https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.js')],
  ['preact@8.4.2',parseURLToElement('https://cdn.jsdelivr.net/npm/preact@8.4.2/dist/preact.min.js')],
  ['d3@5.7.0',parseURLToElement('https://cdnjs.cloudflare.com/ajax/libs/d3/5.7.0/d3.min.js')]
])