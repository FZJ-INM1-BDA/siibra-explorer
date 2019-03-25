import { Action } from '@ngrx/store'

export function spatialSearchState(state:SpatialDataStateInterface = initSpatialDataState, action:SpatialDataEntries){
  switch (action.type){
    case SPATIAL_GOTO_PAGE:
      return Object.assign({},state,{
        spatialSearchPagination : action.pageNo
      })
    case UPDATE_SPATIAL_DATA:
      return Object.assign({},state,{
        spatialSearchTotalResults : action.totalResults
      })
    case UPDATE_SPATIAL_DATA_VISIBLE:
      return Object.assign({},state,{
        spatialDataVisible : action.visible
      })
    default :
      return state
  }
}

export interface SpatialDataStateInterface{
  spatialSearchPagination : number
  spatialSearchTotalResults : number
  spatialDataVisible : boolean
}

const initSpatialDataState : SpatialDataStateInterface = {
  spatialDataVisible : true,
  spatialSearchPagination : 0, 
  spatialSearchTotalResults : 0
}

export interface SpatialDataEntries extends Action{
  pageNo? : number
  totalResults? : number
  visible? : boolean
}

export const SPATIAL_GOTO_PAGE = `SPATIAL_GOTO_PAGE`
export const UPDATE_SPATIAL_DATA = `UPDATE_SPATIAL_DATA`
export const UPDATE_SPATIAL_DATA_VISIBLE = `UPDATE_SPATIAL_DATA_VISIBLE `
