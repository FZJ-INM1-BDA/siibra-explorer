import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { ViewerStateInterface, Property, FETCHED_METADATA } from "../services/stateStore.service";


@Injectable({
  providedIn : 'root'
})

export class AtlasViewerConstantsServices{

  public mobile: boolean
  public loadExportNehubaPromise : Promise<boolean>

  public ngLandmarkLayerName = 'spatial landmark layer'
  public ngUserLandmarkLayerName = 'user landmark layer'

  public citationToastDuration = 7000

  /**
   * optimized for nehubaConfig.layout.useNehubaPerspective.fixedZoomPerspectiveSlices
   *  sliceZoom
   *  sliceViewportWidth
   *  sliceViewportHeight
   */
  public nehubaLandmarkConstant = 1e-8

  private TIMEOUT = 4000

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

  /* to be provided by KG in future */
  public templateUrls = [
    // 'res/json/infant.json',
    'res/json/bigbrain.json',
    'res/json/colin.json',
    'res/json/MNI152.json',
    'res/json/waxholmRatV2_0.json',
    'res/json/allenMouse.json'
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
      'Allen Mouse Brain Atlas',
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

  constructor(private store : Store<ViewerStateInterface>){

    const ua = window && window.navigator && window.navigator.userAgent
      ? window.navigator.userAgent
      : ''

    /* https://stackoverflow.com/a/25394023/6059235 */
    this.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)

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

export const SUPPORT_LIBRARY_MAP : Map<string,HTMLElement> = new Map([
  ['jquery@3',parseURLToElement('http://code.jquery.com/jquery-3.3.1.min.js')],
  ['jquery@2',parseURLToElement('http://code.jquery.com/jquery-2.2.4.min.js')],
  ['webcomponentsLite@1.1.0',parseURLToElement('https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.1.0/webcomponents-lite.js')],
  ['react@16',parseURLToElement('https://unpkg.com/react@16/umd/react.development.js')],
  ['reactdom@16',parseURLToElement('https://unpkg.com/react-dom@16/umd/react-dom.development.js')],
  ['vue@2.5.16',parseURLToElement('https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.js')],
])
