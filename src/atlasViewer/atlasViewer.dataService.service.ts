import { Injectable, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, FETCHED_TEMPLATE, DataEntry, FETCHED_DATAENTRIES, safeFilter, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA } from "../services/stateStore.service";
import { map, distinctUntilChanged, debounceTime } from "rxjs/operators";
import { Subscription, combineLatest } from "rxjs";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";
import { PluginManifest } from "./atlasViewer.pluginService.service";

@Injectable({
  providedIn : 'root'
})
export class AtlasViewerDataService implements OnDestroy{
  
  private subscriptions : Subscription[] = []

  /**
   * TODO ensure 
   */
  public promiseFetchedPluginManifests : Promise<PluginManifest[]> = new Promise((resolve,reject)=>{
    Promise.all([
      PLUGINDEV
        ? fetch(PLUGINDEV).then(res => res.json())
        : Promise.resolve([]),
      Promise.all(
        BUNDLEDPLUGINS
          .filter(v => typeof v === 'string')
          .map(v => fetch(`res/plugin_examples/${v}/manifest.json`).then(res => res.json()))
      )
        .then(arr => arr.reduce((acc,curr) => acc.concat(curr) ,[]))
    ])
      .then(arr => resolve( [].concat(arr[0]).concat(arr[1]) ))
      .catch(reject)
  })
  
  constructor(
    private store : Store<ViewerStateInterface>,
    private constantService : AtlasViewerConstantsServices
  ){
    this.constantService.templateUrlsPr
      .then(urls => 
        urls.map(url => 
          this.constantService.raceFetch(`${this.constantService.backendUrl}${url}`)
            .then(res => res.json())
            .then(json => new Promise((resolve, reject) => {
              if(json.nehubaConfig)
                resolve(json)
              else if(json.nehubaConfigURL)
                this.constantService.raceFetch(`${this.constantService.backendUrl}${json.nehubaConfigURL}`)
                  .then(res => res.json())
                  .then(json2 => resolve({
                      ...json,
                      nehubaConfig: json2
                    }))
                  .catch(reject)
              else
                reject('neither nehubaConfig nor nehubaConfigURL defined')
            }))
            .then(json => this.store.dispatch({
              type: FETCHED_TEMPLATE,
              fetchedTemplate: json
            }))
            .catch(e => {
              console.warn('fetching template url failed', e)
              this.store.dispatch({
                type: FETCHED_TEMPLATE,
                fetchedTemplate: null
              })
            })
        ))

    this.init()
  }

  /* all units in mm */
  public spatialSearch(obj:any){
    const {center,searchWidth,templateSpace,pageNo} = obj
    const SOLR_C = `metadata/`
    const SEARCH_PATH = `select`
    const url = new URL(this.constantService.spatialSearchUrl+SOLR_C+SEARCH_PATH)
    
    /* do not set fl to get all params */
    // url.searchParams.append('fl','geometry.coordinates_0___pdouble,geometry.coordinates_1___pdouble,geometry.coordinates_2___pdouble')

    url.searchParams.append('q','*:*')
    url.searchParams.append('wt','json')
    url.searchParams.append('indent','on')

    /* pagination on app level. if there are too many restuls, we could reintroduce pagination on search level */
    url.searchParams.append('start',(pageNo*this.constantService.spatialResultsPerPage).toString())
    url.searchParams.append('rows',this.constantService.spatialResultsPerPage.toString())
    
    /* TODO future for template space? */
    const filterTemplateSpace = templateSpace == 'MNI Colin 27' ? 
      'datapath:metadata/sEEG-sample.json' :
        templateSpace == 'Waxholm Space rat brain atlas v.2.0' ?
        'datapath:metadata/OSLO_sp_data_rev.json' :
          null
    
    if (templateSpace === 'MNI 152 ICBM 2009c Nonlinear Asymmetric'){
      return Promise.all([
        fetch('res/json/***REMOVED***.json').then(res=>res.json()),
        fetch('res/json/***REMOVED***.json').then(res=>res.json())
      ])
        .then(arr => {
          this.store.dispatch({
            type : FETCHED_SPATIAL_DATA,
            fetchedDataEntries: arr
              .reduce((acc, curr) => acc.concat(curr), [])
              .map((obj, idx) => {
                return {
                  ...obj,
                  name: `Spatial landmark #${idx}`,
                  properties: {}
                }
              })
          })
          this.store.dispatch({
            type : UPDATE_SPATIAL_DATA,
            totalResults : arr.reduce((acc,curr) => acc + curr.length, 0)
          })
        })
        .catch(console.error)
    }else if (templateSpace === 'Allen adult mouse brain reference atlas V3'){
      return Promise.all([
        // 'res/json/allen3DVolumeAggregated.json',
        'res/json/allenTestPlane.json',
        'res/json/allen3DReconAggregated.json'
      ].map(url => fetch(url).then(res => res.json())))
        .then(arr => arr.reduce((acc, curr) => acc.concat(curr), []))
        .then(arr => {
          this.store.dispatch({
            type : FETCHED_SPATIAL_DATA,
            fetchedDataEntries : arr.map(item => Object.assign({}, item, { properties : {} }))
          })
          this.store.dispatch({
            type : UPDATE_SPATIAL_DATA,
            totalResults : arr.length
          })
        })
        .catch(console.error)
    }else if (templateSpace === 'Waxholm Space rat brain atlas v.2.0'){
      return Promise.all([
        // fetch('res/json/waxholmPlaneAggregatedData.json').then(res => res.json()),
        fetch('res/json/camillaWaxholmPointsAggregatedData.json').then(res => res.json())
      ])
        .then(arr => arr.reduce((acc,curr) => acc.concat(curr) ,[]))
        .then(arr => {
          this.store.dispatch({
            type : FETCHED_SPATIAL_DATA,
            fetchedDataEntries : arr.map(item => Object.assign({}, item, { properties : {} }))
          })
          this.store.dispatch({
            type : UPDATE_SPATIAL_DATA,
            totalResults : arr.length
          })
        })
        .catch(console.error)
    }else{
      return 
    }
    url.searchParams.append('fq',`geometry.coordinates:[${center.map(n=>n-searchWidth).join(',')}+TO+${center.map(n=>n+searchWidth).join(',')}]`)
    const fetchUrl = url.toString().replace(/\%2B/gi,'+')

    fetch(fetchUrl).then(r=>r.json())
      .then((resp)=>{
        const dataEntries = resp.response.docs.map(doc=>({
          name : doc['OID'][0],
          geometry : {
            type : 'point',
            position : doc['geometry.coordinates'][0].split(',').map(string=>Number(string)),
          },
          properties : {
            description : doc['OID'][0],
            publications : []
          },
          files:[]
        }))
        this.store.dispatch({
          type : FETCHED_SPATIAL_DATA,
          fetchedDataEntries : dataEntries
        })
        this.store.dispatch({
          type : UPDATE_SPATIAL_DATA,
          totalResults : resp.response.numFound
        })
      })
      .catch(console.warn)

  }

  init(){

    const dispatchData = (arr:DataEntry[][]) =>{
      this.store.dispatch({
        type : FETCHED_DATAENTRIES,
        fetchedDataEntries : arr.reduce((acc,curr)=>acc.concat(curr),[])
      })
    }

    const fetchData = (templateName : string, parcellationName: string) => {
      dispatchData([])
      const encodedTemplateName = encodeURI(templateName)
      const encodedParcellationName = encodeURI(parcellationName)
      Promise.all([
        fetch(`${this.constantService.backendUrl}datasets/templateName/${encodedTemplateName}`)
          .then(res => res.json()),
        fetch(`${this.constantService.backendUrl}datasets/parcellationName/${encodedParcellationName}`)
          .then(res => res.json())
      ])
        .then(arr => [...arr[0], ...arr[1]])
        .then(arr => arr.reduce((acc, item) => {
          const newMap = new Map(acc)
          return newMap.set(item.name, item)
        }, new Map()))
        .then(map => Array.from(map.values()))
        .then(dispatchData)
        .catch(console.warn)
    }

    this.subscriptions.push(
      combineLatest(
        this.store.pipe(
          select('viewerState'),
          safeFilter('templateSelected'),
          map(({templateSelected})=>(templateSelected.name)),
          distinctUntilChanged()
        ),
        this.store.pipe(
          select('viewerState'),
          safeFilter('parcellationSelected'),
          map(({parcellationSelected})=>(parcellationSelected.name)),
          distinctUntilChanged()
        )
      ).pipe(
        debounceTime(16)
      ).subscribe((param : [string, string] ) => fetchData(param[0], param[1]))
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }
}