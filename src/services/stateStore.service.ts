import { Action } from '@ngrx/store'
import { filter } from 'rxjs/operators';
import { NgAnalyzeModulesHost } from '@angular/compiler';

export const NEWVIEWER = 'NEWVIEWER'

export const FETCHED_TEMPLATES = 'FETCHED_TEMPLATES'
export const SELECT_PARCELLATION = `SELECT_PARCELLATION`
export const SELECT_REGIONS = `SELECT_REGIONS`
export const LABELIDX_MAP = 'LABELIDX_MAP'

export const CHANGE_NAVIGATION = 'CHANGE_NAVIGATION'

export const FETCHED_DATAENTRIES = 'FETCHED_DATAENTRIES'
export const FETCHED_METADATA = 'FETCHED_METADATA'

export interface ViewerStateInterface{
  fetchedTemplates : any[]

  templateSelected : any | null
  parcellationSelected : any | null
  regionsSelected : any[]

  navigation : any | null
}

export interface AtlasAction extends Action{
  fetchedTemplate? : any[]

  selectTemplate? : any
  selectParcellation? : any
  selectRegions? : any[]

  changeNavigation? : any
}

export interface NewViewerAction extends Action{
  selectTemplate : any,
  selectParcellation :any
}

export interface DatasetAction extends Action{
  fetchedDataEntries : DataEntry[]
  fetchedMetadataMap : Map<string,Map<string,{properties:Property}>>
}

export interface DataStateInterface{
  fetchedDataEntries : DataEntry[]

  /**
   * Map that maps parcellation name to a Map, which maps datasetname to Property Object
   */
  fetchedMetadataMap : Map<string,Map<string,{properties:Property}>>
}

export function newViewer(state:any,action:NewViewerAction){
  switch(action.type){
    case NEWVIEWER:
      return Object.assign({},state,{
        templateSelected:action.selectTemplate,
        parcellationSelected : action.selectParcellation,
        regionsSelected : []
      })
    default :
      return state
  }
}

export function viewerState(state:ViewerStateInterface,action:AtlasAction){
  switch(action.type){
    case FETCHED_TEMPLATES : {
      return Object.assign({},state,{fetchedTemplates:action.fetchedTemplate})
    }
    case CHANGE_NAVIGATION : {
      return Object.assign({},state,{navigation : action.changeNavigation})
    }
    case SELECT_PARCELLATION : {
      return Object.assign({},state,{
        parcellationSelected : action.selectParcellation,
        regionsSelected : []
      })
    }
    case SELECT_REGIONS : {
      return Object.assign({},state,{regionsSelected : action.selectRegions})
    }
    case LABELIDX_MAP : {
      return Object.assign({},state,{
      })
    }
    default :
      return state
  }
}

export function dataStore(state:any,action:DatasetAction){
  switch (action.type){
    case FETCHED_DATAENTRIES: {
      return Object.assign({},state,{
        fetchedDataEntries : action.fetchedDataEntries
      })
    }
    case FETCHED_METADATA : {
      return Object.assign({},state,{
        fetchedMetadataMap : action.fetchedMetadataMap
      })
    }
  }
}

export function safeFilter(key:string){
  return filter((state:any)=>
    typeof state !== 'undefined' &&
    typeof state[key] !== 'undefined')
}

export function extractLabelIdx(region:any):number[]{
  return region.children.reduce((acc,item)=>{
    return acc.concat(extractLabelIdx(item))
  },[]).concat( region.labelIndex ? region.labelIndex : [] )
}

export interface DataEntry{
  type : string
  name : string
  regionName : {
    regionName : string,
    relationship : string
  }[]

  properties : Property

  files : File[]
}

export interface File{
  filename : string
  name : string
  mimetype : string
  url? : string
  data? : any
  targetParcellation : string
}

export interface Property{
  description : string
  publications : Publication[]
}

export interface Publication{
  doi : string
  citation : string
}

export interface DataTypeMetadata{

}