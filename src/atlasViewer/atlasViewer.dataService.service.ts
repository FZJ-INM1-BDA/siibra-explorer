import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, FETCHED_TEMPLATES, DataEntry, FETCHED_DATAENTRIES, safeFilter, FETCHED_METADATA, Property, FETCHED_SPATIAL_DATA, UPDATE_SPATIAL_DATA } from "../services/stateStore.service";
import { map, distinctUntilChanged } from "rxjs/operators";
import { Subscription } from "rxjs";
import { AtlasViewerConstantsServices } from "./atlasViewer.constantService.service";

@Injectable({
  providedIn : 'root'
})
export class AtlasViewerDataService implements OnDestroy{
  
  private subscriptions : Subscription[] = []
  
  constructor(
    private store : Store<ViewerStateInterface>,
    private constantService : AtlasViewerConstantsServices
  ){

    Promise.all(this.constantService.templateUrls.map(url=>
      fetch(url)
        .then(res=>
          res.json())
        .then(json=>json.nehubaConfig && !json.nehubaConfigURL ? 
          Promise.resolve(json) :
          fetch(json.nehubaConfigURL)
            .then(r=>r.json())
            .then(nehubaConfig=>Promise.resolve(Object.assign({},json,{ nehubaConfig })))
        )))
      .then(arrJson=>
        this.store.dispatch({
          type : FETCHED_TEMPLATES,
          fetchedTemplate : arrJson
        }))
      .catch(console.error)

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
        templateSpace == 'Waxholm Rat V2.0' ?
        'datapath:metadata/OSLO_sp_data_rev.json' :
          null

    if(filterTemplateSpace){
      url.searchParams.append('fq',filterTemplateSpace)
    }else{
      return 
    }
    url.searchParams.append('fq',`geometry.coordinates:[${center.map(n=>n-searchWidth).join(',')}+TO+${center.map(n=>n+searchWidth).join(',')}]`)
    const fetchUrl = url.toString().replace(/\%2B/gi,'+')

    fetch(fetchUrl).then(r=>r.json())
      .then((resp)=>{
        const dataEntries = resp.response.docs.map(doc=>({
          position : doc['geometry.coordinates'][0].split(',').map(string=>Number(string)),
          properties : {
            description : doc['OID'][0],
            publications : []
          }
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

    const fetchData = (parcellationName : string) => {
      const urlArrays = this.constantService.mapParcellationNameToFetchUrl.get(parcellationName)
      urlArrays ?
        Promise.all(urlArrays.map(url=>fetch(url).then(res=>res.json())))
          .then(arr=>dispatchData(arr))
          .catch(console.warn) :
        dispatchData([])
    }
      
    this.subscriptions.push(
      this.store.pipe(
        select('viewerState'),
        safeFilter('parcellationSelected'),
        map(({parcellationSelected})=>(parcellationSelected.name)),
        distinctUntilChanged()
      )
        .subscribe(fetchData)
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s=>s.unsubscribe())
  }
}