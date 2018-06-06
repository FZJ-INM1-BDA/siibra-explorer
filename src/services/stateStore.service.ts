import { Action } from '@ngrx/store'
import { filter } from 'rxjs/operators';

export const NEWVIEWER = 'NEWVIEWER'

export const FETCHED_TEMPLATES = 'FETCHED_TEMPLATES'
export const SELECT_PARCELLATION = `SELECT_PARCELLATION`
export const SELECT_REGIONS = `SELECT_REGIONS`

export const CHANGE_NAVIGATION = 'CHANGE_NAVIGATION'

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

export function newViewer(state:any,action:NewViewerAction){
  switch(action.type){
    case NEWVIEWER:
      return Object.assign({},state,{
        templateSelected:action.selectTemplate,
        parcellationSelected : action.selectParcellation
      })
    default :
      return state
  }
}

export function changeState(state:ViewerStateInterface,action:AtlasAction){
  switch(action.type){
    case FETCHED_TEMPLATES : {
      return Object.assign({},state,{fetchedTemplates:action.fetchedTemplate})
    }
    case CHANGE_NAVIGATION : {
      return Object.assign({},state,{navigation : action.changeNavigation})
    }
    // case SELECT_TEMPLATE : {
    //   /* check for query param */
    //   return Object.assign({},state,{
    //     templateSelected : action.selectTemplate,
    //     parcellationSelected : action.selectTemplate.parcellations[0]
    //   })
    // }
    case SELECT_PARCELLATION : {
      return Object.assign({},state,{parcellationSelected : action.selectParcellation})
    }
    case SELECT_REGIONS : {
      return Object.assign({},state,{regionsSelected : action.selectRegions})
    }
    default :
      return state
  }
}

export function safeFilter(key:string){
  return filter((state:ViewerStateInterface)=>
    typeof state !== 'undefined' &&
    typeof state[key] !== 'undefined')
}

export function extractLabelIdx(region:any):number[]{
  return region.children.reduce((acc,item)=>{
    return acc.concat(extractLabelIdx(item))
  },[]).concat( region.labelIndex ? region.labelIndex : [] )
}