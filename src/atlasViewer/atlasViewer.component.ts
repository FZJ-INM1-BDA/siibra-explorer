import { Component, HostBinding, ViewChild, ViewContainerRef, AfterViewInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { ViewerStateInterface, FETCHED_TEMPLATES, safeFilter, Property, FETCHED_METADATA, FETCHED_DATAENTRIES, DataEntry } from "../services/stateStore.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector : 'atlas-viewer',
  templateUrl : './atlasViewer.template.html',
  styleUrls : [
    `./atlasViewer.style.css`
  ]
})

export class AtlasViewer implements AfterViewInit{

  @HostBinding('attr.darktheme') 
  darktheme : boolean = false

  @ViewChild('sidecontent',{read:ViewContainerRef}) sideContent : ViewContainerRef

  selectedTemplate$ : Observable<any>

  constructor(private store : Store<ViewerStateInterface>){
    const urls = [
      'res/json/infant.json',
      'res/json/bigbrain.json',
      'res/json/colin.json',
      'res/json/MNI152.json',
      'res/json/waxholmRatV2_0.json',
      'res/json/allenMouse.json'
    ]

    Promise.all(urls.map(url=>
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

      this.selectedTemplate$ = this.store.pipe(
        select('newViewer'),
        safeFilter('templateSelected'),
        map(state=>state.templateSelected))

      this.selectedTemplate$.subscribe(template=>this.darktheme = template.useTheme === 'dark')
  }

  ngAfterViewInit(){

    const meta = 'res/json/allAggregatedData.json'
    const urls = [
      'res/json/receptorAggregatedData.json',
      'res/json/pmapsAggregatedData.json',
      'res/json/dwmAggregatedData.json',
      'res/json/swmAggregatedData.json',
      'res/json/dartboardAggregatedData.json'
    ]

    const dispatchData = (arr:DataEntry[][]) =>{
      this.store.dispatch({
        type : FETCHED_DATAENTRIES,
        fetchedDataEntries : arr.reduce((acc,curr)=>acc.concat(curr),[])
      })
    }

    const fetchData = (parcellationName : string) => {
      if(parcellationName == 'JuBrain Cytoarchitectonic Atlas'){
        Promise.all([
          fetch('res/json/pmapsAggregatedData.json').then(res=>res.json()),
          fetch('res/json/receptorAggregatedData.json').then(res=>res.json()),
        ])
          .then(arr=>dispatchData(arr))
          .catch(console.warn)
      }
      else if (parcellationName == 'Fibre Bundle Atlas - Short Bundle'){
        Promise.all([fetch('res/json/swmAggregatedData.json').then(res=>res.json())])
          .then(arr=>dispatchData(arr))
          .catch(console.warn)
        
      }else if (parcellationName == 'Fibre Bundle Atlas - Long Bundle'){
        
        Promise.all([fetch('res/json/dwmAggregatedData.json').then(res=>res.json())])
          .then(arr=>dispatchData(arr))
          .catch(console.warn)
      }
      else{
        dispatchData([])
      }
    }
    
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

    this.store.pipe(
      select('viewerState'),
      safeFilter('parcellationSelected'),
      map(({parcellationSelected})=>(parcellationSelected.name))
    )
      .subscribe(fetchData)
    this.store.pipe(
      select('newViewer'),
      safeFilter('parcellationSelected'),
      map(({parcellationSelected})=>(parcellationSelected.name))
    )
      .subscribe(fetchData)
  }
}