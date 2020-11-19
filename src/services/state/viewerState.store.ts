import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store'
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, startWith, withLatestFrom, mapTo } from 'rxjs/operators';
import { IUserLandmark } from 'src/atlasViewer/atlasViewer.apiService.service';
import { INgLayerInterface } from 'src/atlasViewer/atlasViewer.component';
import { getViewer } from 'src/util/fn';
import { LoggingService } from 'src/logging';
import { generateLabelIndexId, IavRootStoreInterface } from '../stateStore.service';
import { GENERAL_ACTION_TYPES } from '../stateStore.service'
import { CLOSE_SIDE_PANEL } from './uiState.store';
import { 
  viewerStateSetSelectedRegions,
  viewerStateSetConnectivityRegion,
  viewerStateSelectAtlas,
  viewerStateSelectParcellation,
  viewerStateSelectRegionWithIdDeprecated,
  viewerStateCustomLandmarkSelector,
  viewerStateDblClickOnViewer,
  viewerStateAddUserLandmarks,
  viewreStateRemoveUserLandmarks,
  viewerStateMouseOverCustomLandmark,
  viewerStateMouseOverCustomLandmarkInPerspectiveView,
  viewerStateNewViewer
} from './viewerState.store.helper';
import { cvtNehubaConfigToNavigationObj } from 'src/ui/viewerStateController/viewerState.useEffect';
import { viewerStateChangeNavigation } from './viewerState/actions';

export interface StateInterface {
  fetchedTemplates: any[]

  templateSelected: any | null
  parcellationSelected: any | null
  regionsSelected: any[]

  landmarksSelected: any[]
  userLandmarks: IUserLandmark[]

  navigation: any | null
  dedicatedView: string[]

  loadedNgLayers: INgLayerInterface[]
  connectivityRegion: string | null
  overwrittenColorMap: boolean

  standaloneVolumes: any[]
}

export interface ActionInterface extends Action {
  fetchedTemplate?: any[]

  selectTemplate?: any
  selectParcellation?: any
  selectRegions?: any[]
  selectRegionIds: string[]
  deselectRegions?: any[]
  dedicatedView?: string

  updatedParcellation?: any

  landmarks: IUserLandmark[]
  deselectLandmarks: IUserLandmark[]

  navigation?: any

  payload: any

  connectivityRegion?: string
}

export const defaultState: StateInterface = {

  landmarksSelected : [],
  fetchedTemplates : [],
  loadedNgLayers: [],
  regionsSelected: [],
  userLandmarks: [],
  dedicatedView: null,
  navigation: null,
  parcellationSelected: null,
  templateSelected: null,
  connectivityRegion: '',
  overwrittenColorMap: false,
  standaloneVolumes: []
}

export const getStateStore = ({ state = defaultState } = {}) => (prevState: Partial<StateInterface> = state, action: ActionInterface) => {
  switch (action.type) {
  /**
     * TODO may be obsolete. test when nifti become available
     */
  case LOAD_DEDICATED_LAYER: {
    const dedicatedView = prevState.dedicatedView
      ? prevState.dedicatedView.concat(action.dedicatedView)
      : [action.dedicatedView]
    return {
      ...prevState,
      dedicatedView,
    }
  }
  case UNLOAD_DEDICATED_LAYER:
    return {
      ...prevState,
      dedicatedView : prevState.dedicatedView
        ? prevState.dedicatedView.filter(dv => dv !== action.dedicatedView)
        : [],
    }
  case CLEAR_STANDALONE_VOLUMES:
    return {
      ...prevState,
      standaloneVolumes: []
    }
  case NEWVIEWER: {

    const {
      selectParcellation: parcellation,
      navigation,
      selectTemplate,
    } = action
    const navigationFromTemplateSelected = cvtNehubaConfigToNavigationObj(selectTemplate?.nehubaConfig?.dataset?.initialNgState)
    return {
      ...prevState,
      templateSelected : selectTemplate,
      parcellationSelected : parcellation,
      // taken care of by effect.ts
      // regionsSelected : [],

      // taken care of by effect.ts
      // landmarksSelected : [],
      navigation : navigation || navigationFromTemplateSelected,
      dedicatedView : null,
    }
  }
  case FETCHED_TEMPLATE : {
    return {
      ...prevState,
      fetchedTemplates: prevState.fetchedTemplates.concat(action.fetchedTemplate),
    }
  }
  case viewerStateChangeNavigation.type:
  case CHANGE_NAVIGATION : {
    return {
      ...prevState,
      navigation : action.navigation,
    }
  }
  case viewerStateSelectParcellation.type:
  case SELECT_PARCELLATION : {
    const { selectParcellation } = action
    return {
      ...prevState,
      parcellationSelected: selectParcellation,
      // taken care of by effect.ts
      // regionsSelected: []
    }
  }
  case viewerStateSetSelectedRegions.type:
  case SELECT_REGIONS: {
    const { selectRegions } = action
    return {
      ...prevState,
      regionsSelected: selectRegions,
    }
  }
  case DESELECT_LANDMARKS : {
    return {
      ...prevState,
      landmarksSelected : prevState.landmarksSelected.filter(lm => action.deselectLandmarks.findIndex(dLm => dLm.name === lm.name) < 0),
    }
  }
  case SELECT_LANDMARKS : {
    return {
      ...prevState,
      landmarksSelected : action.landmarks,
    }
  }
  case USER_LANDMARKS : {
    return {
      ...prevState,
      userLandmarks: action.landmarks,
    }
  }
  /**
     * TODO
     * duplicated with ngViewerState.layers ?
     */
  case NEHUBA_LAYER_CHANGED: {
    const viewer = getViewer()
    if (!viewer) {
      return {
        ...prevState,
        loadedNgLayers: [],
      }
    } else {
      return {
        ...prevState,
        loadedNgLayers: (viewer.layerManager.managedLayers as any[]).map(obj => ({
          name : obj.name,
          type : obj.initialSpecification.type,
          source : obj.sourceUrl,
          visible : obj.visible,
        }) as INgLayerInterface),
      }
    }
  }
  case GENERAL_ACTION_TYPES.APPLY_STATE: {
    const { viewerState } = (action as any).state
    return viewerState
  }
  case viewerStateSetConnectivityRegion.type:
  case SET_CONNECTIVITY_REGION:
    return {
      ...prevState,
      connectivityRegion: action.connectivityRegion,
    }
  case CLEAR_CONNECTIVITY_REGION:
    return {
      ...prevState,
      connectivityRegion: '',
    }
  case SET_CONNECTIVITY_VISIBLE:
    return {
      ...prevState,
      overwrittenColorMap: action.payload || '',
    }  
  default :
    return prevState
  }
}

// must export a named function for aot compilation
// see https://github.com/angular/angular/issues/15587
// https://github.com/amcdnl/ngrx-actions/issues/23
// or just google for:
//
// angular function expressions are not supported in decorators

const defaultStateStore = getStateStore()

export function stateStore(state, action) {
  return defaultStateStore(state, action)
}

export const LOAD_DEDICATED_LAYER = 'LOAD_DEDICATED_LAYER'
export const UNLOAD_DEDICATED_LAYER = 'UNLOAD_DEDICATED_LAYER'

export const NEWVIEWER = viewerStateNewViewer.type

export const FETCHED_TEMPLATE = 'FETCHED_TEMPLATE'
export const CHANGE_NAVIGATION = viewerStateChangeNavigation.type

export const SELECT_PARCELLATION = viewerStateSelectParcellation.type

export const DESELECT_REGIONS = `DESELECT_REGIONS`
export const SELECT_REGIONS = `SELECT_REGIONS`
export const SELECT_REGIONS_WITH_ID = viewerStateSelectRegionWithIdDeprecated.type
export const SELECT_LANDMARKS = `SELECT_LANDMARKS`
export const DESELECT_LANDMARKS = `DESELECT_LANDMARKS`
export const USER_LANDMARKS = `USER_LANDMARKS`

export const ADD_TO_REGIONS_SELECTION_WITH_IDS = `ADD_TO_REGIONS_SELECTION_WITH_IDS`

export const NEHUBA_LAYER_CHANGED = `NEHUBA_LAYER_CHANGED`
export const SET_CONNECTIVITY_REGION = `SET_CONNECTIVITY_REGION`
export const CLEAR_CONNECTIVITY_REGION = `CLEAR_CONNECTIVITY_REGION`
export const SET_CONNECTIVITY_VISIBLE = `SET_CONNECTIVITY_VISIBLE`
export const CLEAR_STANDALONE_VOLUMES = `CLEAR_STANDALONE_VOLUMES`

@Injectable({
  providedIn: 'root',
})

export class ViewerStateUseEffect {
  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private log: LoggingService,
  ) {

    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1)
    )
    this.currentLandmarks$ = this.store$.pipe(
      select(viewerStateCustomLandmarkSelector),
      shareReplay(1),
    )

    this.removeUserLandmarks = this.actions$.pipe(
      ofType(ACTION_TYPES.REMOVE_USER_LANDMARKS),
      withLatestFrom(this.currentLandmarks$),
      map(([action, currentLandmarks]) => {
        const { landmarkIds } = (action as ActionInterface).payload
        for ( const rmId of landmarkIds ) {
          const idx = currentLandmarks.findIndex(({ id }) => id === rmId)
          if (idx < 0) { this.log.warn(`remove userlandmark with id ${rmId} does not exist`) }
        }
        const removeSet = new Set(landmarkIds)
        return {
          type: USER_LANDMARKS,
          landmarks: currentLandmarks.filter(({ id }) => !removeSet.has(id)),
        }
      }),
    )

    this.addUserLandmarks$ = this.actions$.pipe(
      ofType(viewerStateAddUserLandmarks.type),
      withLatestFrom(this.currentLandmarks$),
      map(([action, currentLandmarks]) => {
        const { landmarks } = action as ActionInterface
        const landmarkMap = new Map()
        for (const landmark of currentLandmarks) {
          const { id } = landmark
          landmarkMap.set(id, landmark)
        }
        for (const landmark of landmarks) {
          const { id } = landmark
          if (landmarkMap.has(id)) {
            this.log.warn(`Attempting to add a landmark that already exists, id: ${id}`)
          } else {
            landmarkMap.set(id, landmark)
          }
        }
        const userLandmarks = Array.from(landmarkMap).map(([_id, landmark]) => landmark)
        return {
          type: USER_LANDMARKS,
          landmarks: userLandmarks,
        }
      }),
    )

    this.mouseoverUserLandmarks = this.actions$.pipe(
      ofType(viewerStateMouseOverCustomLandmarkInPerspectiveView.type),
      withLatestFrom(this.currentLandmarks$),
      map(([ action, currentLandmarks ]) => {
        const { payload } = action as any
        const { label } = payload
        if (!label) {
          return viewerStateMouseOverCustomLandmark({
            payload: {
              userLandmark: null
            }
          })
        }

        const idx = Number(label.replace('label=', ''))
        if (isNaN(idx)) {
          this.log.warn(`Landmark index could not be parsed as a number: ${idx}`)
          return viewerStateMouseOverCustomLandmark({
            payload: { userLandmark: null }
          })
        }
        return viewerStateMouseOverCustomLandmark({
          payload: {
            userLandmark: currentLandmarks[idx]
          }
        })
      }),

    )

    const doubleClickOnViewer$ = this.actions$.pipe(
      ofType(ACTION_TYPES.DOUBLE_CLICK_ON_VIEWER),
      map(action => {
        const { payload } = action as any
        const { segments, landmark, userLandmark } = payload
        return { segments, landmark, userLandmark }
      }),
      shareReplay(1),
    )

    this.doubleClickOnViewerToggleRegions$ = doubleClickOnViewer$.pipe(
      filter(({ segments }) => segments && segments.length > 0),
      withLatestFrom(viewerState$.pipe(
        select('regionsSelected'),
        distinctUntilChanged(),
        startWith([]),
      )),
      map(([{ segments }, regionsSelected]) => {
        const selectedSet = new Set(regionsSelected.map(generateLabelIndexId))
        const toggleArr = segments.map(({ segment, layer }) => generateLabelIndexId({ ngId: layer.name, ...segment }))

        const deleteFlag = toggleArr.some(id => selectedSet.has(id))

        for (const id of toggleArr) {
          if (deleteFlag) { selectedSet.delete(id) } else { selectedSet.add(id) }
        }

        return {
          type: SELECT_REGIONS_WITH_ID,
          selectRegionIds: [...selectedSet],
        }
      }),
    )

    this.doubleClickOnViewerToggleLandmark$ = doubleClickOnViewer$.pipe(
      filter(({ landmark }) => !!landmark),
      withLatestFrom(viewerState$.pipe(
        select('landmarksSelected'),
        startWith([]),
      )),
      map(([{ landmark }, selectedSpatialDatas]) => {

        const selectedIdx = selectedSpatialDatas.findIndex(data => data.name === landmark.name)

        const newSelectedSpatialDatas = selectedIdx >= 0
          ? selectedSpatialDatas.filter((_, idx) => idx !== selectedIdx)
          : selectedSpatialDatas.concat(landmark)

        return {
          type: SELECT_LANDMARKS,
          landmarks: newSelectedSpatialDatas,
        }
      }),
    )

    this.doubleClickOnViewerToogleUserLandmark$ = doubleClickOnViewer$.pipe(
      filter(({ userLandmark }) => userLandmark),
    )

    this.onStandAloneVolumesExistCloseMatDrawer$ = viewerState$.pipe(
      select('standaloneVolumes'),
      filter(v => v && Array.isArray(v) && v.length > 0),
      mapTo({
        type: CLOSE_SIDE_PANEL
      })
    )
  }

  private currentLandmarks$: Observable<any[]>

  @Effect()
  public onStandAloneVolumesExistCloseMatDrawer$: Observable<any>

  @Effect()
  public mouseoverUserLandmarks: Observable<any>

  @Effect()
  public removeUserLandmarks: Observable<any>

  @Effect()
  public addUserLandmarks$: Observable<any>

  @Effect()
  public doubleClickOnViewerToggleRegions$: Observable<any>

  @Effect()
  public doubleClickOnViewerToggleLandmark$: Observable<any>

  // @Effect()
  public doubleClickOnViewerToogleUserLandmark$: Observable<any>
}

const ACTION_TYPES = {
  REMOVE_USER_LANDMARKS: viewreStateRemoveUserLandmarks.type,

  SINGLE_CLICK_ON_VIEWER: 'SINGLE_CLICK_ON_VIEWER',
  DOUBLE_CLICK_ON_VIEWER: viewerStateDblClickOnViewer.type
}

export const VIEWERSTATE_ACTION_TYPES = ACTION_TYPES
