import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store'
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, startWith, withLatestFrom } from 'rxjs/operators';
import { IUserLandmark } from 'src/atlasViewer/atlasViewer.apiService.service';
import { INgLayerInterface } from 'src/atlasViewer/atlasViewer.component';
import { getViewer } from 'src/util/fn';
import { LoggingService } from '../logging.service';
import { generateLabelIndexId, IavRootStoreInterface } from '../stateStore.service';
import { GENERAL_ACTION_TYPES } from '../stateStore.service'
import { MOUSEOVER_USER_LANDMARK } from './uiState.store';

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
    case NEWVIEWER: {

      const { selectParcellation: parcellation } = action
      // const parcellation = propagateNgId( selectParcellation ): parcellation
      const { regions, ...parcellationWORegions } = parcellation
      return {
        ...prevState,
        templateSelected : action.selectTemplate,
        parcellationSelected : {
          ...parcellationWORegions,
          regions: null,
        },
        // taken care of by effect.ts
        // regionsSelected : [],
        landmarksSelected : [],
        navigation : {},
        dedicatedView : null,
      }
    }
    case FETCHED_TEMPLATE : {
      return {
        ...prevState,
        fetchedTemplates: prevState.fetchedTemplates.concat(action.fetchedTemplate),
      }
    }
    case CHANGE_NAVIGATION : {
      return {
        ...prevState,
        navigation : action.navigation,
      }
    }
    case SELECT_PARCELLATION : {
      const { selectParcellation: sParcellation } = action
      const { regions, ...sParcellationWORegions } = sParcellation
      return {
        ...prevState,
        parcellationSelected: sParcellationWORegions,
        // taken care of by effect.ts
        // regionsSelected: []
      }
    }
    case UPDATE_PARCELLATION: {
      const { updatedParcellation } = action
      return {
        ...prevState,
        parcellationSelected: {
          ...updatedParcellation,
          updated: true,
        },
      }
    }
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

export const NEWVIEWER = 'NEWVIEWER'

export const FETCHED_TEMPLATE = 'FETCHED_TEMPLATE'
export const CHANGE_NAVIGATION = 'CHANGE_NAVIGATION'

export const SELECT_PARCELLATION = `SELECT_PARCELLATION`
export const UPDATE_PARCELLATION = `UPDATE_PARCELLATION`

export const DESELECT_REGIONS = `DESELECT_REGIONS`
export const SELECT_REGIONS = `SELECT_REGIONS`
export const SELECT_REGIONS_WITH_ID = `SELECT_REGIONS_WITH_ID`
export const SELECT_LANDMARKS = `SELECT_LANDMARKS`
export const DESELECT_LANDMARKS = `DESELECT_LANDMARKS`
export const USER_LANDMARKS = `USER_LANDMARKS`

export const ADD_TO_REGIONS_SELECTION_WITH_IDS = `ADD_TO_REGIONS_SELECTION_WITH_IDS`

export const NEHUBA_LAYER_CHANGED = `NEHUBA_LAYER_CHANGED`
export const SET_CONNECTIVITY_REGION = `SET_CONNECTIVITY_REGION`
export const CLEAR_CONNECTIVITY_REGION = `CLEAR_CONNECTIVITY_REGION`

@Injectable({
  providedIn: 'root',
})

export class ViewerStateUseEffect {
  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private log: LoggingService,
  ) {
    this.currentLandmarks$ = this.store$.pipe(
      select('viewerState'),
      select('userLandmarks'),
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
      ofType(ACTION_TYPES.ADD_USERLANDMARKS),
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
      ofType(ACTION_TYPES.MOUSEOVER_USER_LANDMARK_LABEL),
      withLatestFrom(this.currentLandmarks$),
      map(([ action, currentLandmarks ]) => {
        const { payload } = action as any
        const { label } = payload
        if (!label) { return {
          type: MOUSEOVER_USER_LANDMARK,
          payload: {
            userLandmark: null,
          },
        }
        }

        const idx = Number(label.replace('label=', ''))
        if (isNaN(idx)) {
          this.log.warn(`Landmark index could not be parsed as a number: ${idx}`)
          return {
            type: MOUSEOVER_USER_LANDMARK,
            payload: {
              userLandmark: null,
            },
          }
        }

        return {
          type: MOUSEOVER_USER_LANDMARK,
          payload: {
            userLandmark: currentLandmarks[idx],
          },
        }
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
      withLatestFrom(this.store$.pipe(
        select('viewerState'),
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
      withLatestFrom(this.store$.pipe(
        select('viewerState'),
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
  }

  private currentLandmarks$: Observable<any[]>

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
  ADD_USERLANDMARKS: `ADD_USERLANDMARKS`,
  REMOVE_USER_LANDMARKS: 'REMOVE_USER_LANDMARKS',
  MOUSEOVER_USER_LANDMARK_LABEL: 'MOUSEOVER_USER_LANDMARK_LABEL',

  SINGLE_CLICK_ON_VIEWER: 'SINGLE_CLICK_ON_VIEWER',
  DOUBLE_CLICK_ON_VIEWER: 'DOUBLE_CLICK_ON_VIEWER',
}

export const VIEWERSTATE_ACTION_TYPES = ACTION_TYPES
