import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { ViewerStateInterface, Property, FETCHED_METADATA } from "../services/stateStore.service";


@Injectable({
  providedIn : 'root'
})

export class AtlasViewerConstantsServices{

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
      'Fibre Bundle Atlas - Long Bundle',
      [
        'res/json/dwmAggregatedData.json'
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

  public doesNotMeetRequirementMD = `
Unfortunately, your browser does not meet the minimum requirement to run the atlas viewer. 
the atlas viewer requires **webgl1.0**, and the following extensions to be enabled in order to run: 
- WEBGL_draw_buffers
- OES_texture_float
- OES_element_index_uint
`

  get floatingWidgetStartingPos() : [number,number]{
    return [400,100]
  } 

  constructor(private store : Store<ViewerStateInterface>){

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
