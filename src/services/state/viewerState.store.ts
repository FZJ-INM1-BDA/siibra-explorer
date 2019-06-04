import { Action } from '@ngrx/store'
import { UserLandmark } from 'src/atlasViewer/atlasViewer.apiService.service';
import { getNgIdLabelIndexFromId, generateLabelIndexId, recursiveFindRegionWithLabelIndexId } from '../stateStore.service';

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
  selectRegions?: any[]
  selectRegionIds: string[]
  deselectRegions? : any[]
  dedicatedView? : string

  updatedParcellation? : any

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
      return {
        ...state,
        dedicatedView 
      }
    case UNLOAD_DEDICATED_LAYER:
      return {
        ...state,
        dedicatedView : state.dedicatedView
          ? state.dedicatedView.filter(dv => dv !== action.dedicatedView)
          : []
      }
    case NEWVIEWER:
      const { selectParcellation: parcellation } = action
      // const parcellation = propagateNgId( selectParcellation ): parcellation
      const { regions, ...parcellationWORegions } = parcellation
      return {
        ...state,
        templateSelected : action.selectTemplate,
        parcellationSelected : {
          ...parcellationWORegions,
          regions: null
        },
        // taken care of by effect.ts
        // regionsSelected : [],
        landmarksSelected : [],
        navigation : {},
        dedicatedView : null
      }
    case FETCHED_TEMPLATE : {
      return {
        ...state,
        fetchedTemplates: state.fetchedTemplates.concat(action.fetchedTemplate)
      }
    }
    case CHANGE_NAVIGATION : {
      return {
        ...state,
        navigation : action.navigation
      }
    }
    case SELECT_PARCELLATION : {
      const { selectParcellation:parcellation } = action
      const { regions, ...parcellationWORegions } = parcellation
      return {
        ...state,
        parcellationSelected: parcellationWORegions,
        // taken care of by effect.ts
        // regionsSelected: []
      }
    }
    case UPDATE_PARCELLATION: {
      const { updatedParcellation } = action
      return {
        ...state,
        parcellationSelected: updatedParcellation
      }
    }
    case SELECT_REGIONS:
      const { selectRegions } = action
      return {
        ...state,
        regionsSelected: selectRegions
      }
    case SELECT_REGIONS_WITH_ID : {
      const { parcellationSelected } = state
      const { selectRegionIds } = action
      const { ngId: defaultNgId } = parcellationSelected

      /**
       * for backwards compatibility.
       * older versions of atlas viewer may only have labelIndex as region identifier
       */
      const regionsSelected = selectRegionIds
        .map(labelIndexId => getNgIdLabelIndexFromId({ labelIndexId }))
        .map(({ ngId, labelIndex }) => {
          return {
            labelIndexId: generateLabelIndexId({
              ngId: ngId || defaultNgId,
              labelIndex 
            })
          }
        })
        .map(({ labelIndexId }) => {
          return recursiveFindRegionWithLabelIndexId({ 
            regions: parcellationSelected.regions,
            labelIndexId,
            inheritedNgId: defaultNgId
          })
        })
        .filter(v => {
          if (!v) console.log(`SELECT_REGIONS_WITH_ID, some ids cannot be parsed intto label index`)
          return !!v
        })
      return {
        ...state,
        regionsSelected
      }
    }
    case DESELECT_LANDMARKS : {
      return {
        ...state,
        landmarksSelected : state.landmarksSelected.filter(lm => action.deselectLandmarks.findIndex(dLm => dLm.name === lm.name) < 0)
      }
    }
    case SELECT_LANDMARKS : {
      return {
        ...state,
        landmarksSelected : action.landmarks
      }
    }
    case USER_LANDMARKS : {
      return {
        ...state,
        userLandmarks: action.landmarks
      } 
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
export const UPDATE_PARCELLATION = `UPDATE_PARCELLATION`

export const SELECT_REGIONS = `SELECT_REGIONS`
export const SELECT_REGIONS_WITH_ID = `SELECT_REGIONS_WITH_ID`
export const SELECT_LANDMARKS = `SELECT_LANDMARKS`
export const DESELECT_LANDMARKS = `DESELECT_LANDMARKS`
export const USER_LANDMARKS = `USER_LANDMARKS`
