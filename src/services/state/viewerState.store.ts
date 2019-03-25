import { Action } from '@ngrx/store'
import { UserLandmark } from 'src/atlasViewer/atlasViewer.apiService.service';

export interface ViewerStateInterface{
  fetchedTemplates : any[]

  templateSelected : any | null
  parcellationSelected : any | null
  regionsSelected : any[]

  landmarksSelected : any[]
  userLandmarks : UserLandmark[]

  navigation : any | null
  dedicatedView : string[]
}

export interface AtlasAction extends Action{
  fetchedTemplate? : any[]

  selectTemplate? : any
  selectParcellation? : any
  selectRegions? : any[]
  deselectRegions? : any[]
  dedicatedView? : string

  landmarks : UserLandmark[]
  deselectLandmarks : UserLandmark[]

  navigation? : any
}

export function viewerState(
  state:Partial<ViewerStateInterface> = {
    landmarksSelected : [],
    fetchedTemplates : []
  },
  action:AtlasAction
){
  switch(action.type){
    /**
     * TODO may be obsolete. test when nifti become available
     */
    case LOAD_DEDICATED_LAYER:
      const dedicatedView = state.dedicatedView
        ? state.dedicatedView.concat(action.dedicatedView)
        : [action.dedicatedView]
      return Object.assign({},state,{
        dedicatedView 
      })
    case UNLOAD_DEDICATED_LAYER:
      return Object.assign({},state,{
        dedicatedView : state.dedicatedView
          ? state.dedicatedView.filter(dv => dv !== action.dedicatedView)
          : []
      })
    case NEWVIEWER:
      return Object.assign({},state,{
        templateSelected : action.selectTemplate,
        parcellationSelected : action.selectParcellation,
        regionsSelected : [],
        landmarksSelected : [],
        navigation : {},
        dedicatedView : null
      })
    case FETCHED_TEMPLATE : {
      return Object.assign({}, state, {
        fetchedTemplates: state.fetchedTemplates.concat(action.fetchedTemplate)
      })
    }
    case CHANGE_NAVIGATION : {
      return Object.assign({},state,{navigation : action.navigation})
    }
    case SELECT_PARCELLATION : {
      return Object.assign({},state,{
        parcellationSelected : action.selectParcellation,
        regionsSelected : []
      })
    }
    case DESELECT_REGIONS : {
      return Object.assign({}, state, {
        regionsSelected : state.regionsSelected.filter(re => action.deselectRegions.findIndex(dRe => dRe.name === re.name) < 0)
      })
    }
    case SELECT_REGIONS : {
      return Object.assign({},state,{
        regionsSelected : action.selectRegions.map(region=>Object.assign({},region,{
          labelIndex : Number(region.labelIndex)
        }))
      })
    }
    case DESELECT_LANDMARKS : {
      return Object.assign({}, state, {
        landmarksSelected : state.landmarksSelected.filter(lm => action.deselectLandmarks.findIndex(dLm => dLm.name === lm.name) < 0)
      })
    }
    case SELECT_LANDMARKS : {
      return Object.assign({}, state, {
        landmarksSelected : action.landmarks
      })
    }
    case USER_LANDMARKS : {
      return Object.assign({}, state, {
        userLandmarks : action.landmarks
      })
    }
    default :
      return state
  }
}

export const LOAD_DEDICATED_LAYER = 'LOAD_DEDICATED_LAYER'
export const UNLOAD_DEDICATED_LAYER = 'UNLOAD_DEDICATED_LAYER'

export const NEWVIEWER = 'NEWVIEWER'

export const FETCHED_TEMPLATE = 'FETCHED_TEMPLATE'
export const CHANGE_NAVIGATION = 'CHANGE_NAVIGATION'

export const SELECT_PARCELLATION = `SELECT_PARCELLATION`
export const SELECT_REGIONS = `SELECT_REGIONS`
export const DESELECT_REGIONS = `DESELECT_REGIONS`
export const SELECT_LANDMARKS = `SELECT_LANDMARKS`
export const DESELECT_LANDMARKS = `DESELECT_LANDMARKS`
export const USER_LANDMARKS = `USER_LANDMARKS`
