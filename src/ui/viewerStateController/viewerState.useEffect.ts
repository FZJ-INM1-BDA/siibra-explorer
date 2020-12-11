import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Action, select, Store } from "@ngrx/store";
import { Observable, Subscription, of, merge } from "rxjs";
import { distinctUntilChanged, filter, map, shareReplay, withLatestFrom, switchMap, mapTo, startWith } from "rxjs/operators";
import { CHANGE_NAVIGATION, FETCHED_TEMPLATE, IavRootStoreInterface, SELECT_PARCELLATION, SELECT_REGIONS, generalActionError } from "src/services/stateStore.service";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "./viewerState.base";
import { TemplateCoordinatesTransformation } from "src/services/templateCoordinatesTransformation.service";
import { CLEAR_STANDALONE_VOLUMES } from "src/services/state/viewerState.store";
import { viewerStateToggleRegionSelect, viewerStateHelperSelectParcellationWithId, viewerStateSelectTemplateWithId, viewerStateNavigateToRegion, viewerStateSelectedTemplateSelector, viewerStateFetchedTemplatesSelector, viewerStateNewViewer, viewerStateSelectedParcellationSelector, viewerStateNavigationStateSelector, viewerStateSelectTemplateWithName, viewerStateSelectedRegionsSelector, viewerStateSelectAtlas } from "src/services/state/viewerState.store.helper";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState/selectors";
import { ngViewerActionClearView } from "src/services/state/ngViewerState/actions";
import { PureContantService } from "src/util";
import { verifyPositionArg } from 'common/util'
import { CONST } from 'common/constants'
import { uiActionHideAllDatasets } from "src/services/state/uiState/actions";
import { viewerStateFetchedAtlasesSelector } from "src/services/state/viewerState/selectors";

const defaultPerspectiveZoom = 1e6
const defaultZoom = 1e6

export const defaultNavigationObject = {
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [0 , 0, 0, 1],
  perspectiveZoom: defaultPerspectiveZoom,
  zoom: defaultZoom,
  position: [0, 0, 0],
  positionReal: true
}

export const defaultNehubaConfigObject = {
  perspectiveOrientation: [0, 0, 0, 1],
  perspectiveZoom: 1e6,
  navigation: {
    pose: {
      position: {
        voxelCoordinates: [0, 0, 0],
        voxelSize: [1,1,1]
      },
      orientation: [0, 0, 0, 1],
    },
    zoomFactor: defaultZoom
  }
}

export function cvtNehubaConfigToNavigationObj(nehubaConfig?){
  const { navigation, perspectiveOrientation = [0, 0, 0, 1], perspectiveZoom = 1e6 } = nehubaConfig || {}
  const { pose, zoomFactor = 1e6 } = navigation || {}
  const { position, orientation = [0, 0, 0, 1] } = pose || {}
  const { voxelSize = [1, 1, 1], voxelCoordinates = [0, 0, 0] } = position || {}

  return {
    orientation,
    perspectiveOrientation: perspectiveOrientation,
    perspectiveZoom: perspectiveZoom,
    zoom: zoomFactor,
    position: [0, 1, 2].map(idx => voxelSize[idx] * voxelCoordinates[idx]),
    positionReal: true
  }
}

export function cvtNavigationObjToNehubaConfig(navigationObj, nehubaConfigObj){
  const {
    orientation = [0, 0, 0, 1],
    perspectiveOrientation = [0, 0, 0, 1],
    perspectiveZoom = 1e6,
    zoom = 1e6,
    position = [0, 0, 0],
    positionReal = true,
  } = navigationObj || {}

  const voxelSize = (() => {
    const {
      navigation = {}
    } = nehubaConfigObj || {}
    const { pose = {}, zoomFactor = 1e6 } = navigation
    const { position = {}, orientation = [0, 0, 0, 1] } = pose
    const { voxelSize = [1, 1, 1], voxelCoordinates = [0, 0, 0] } = position
    return voxelSize
  })()

  return {
    perspectiveOrientation,
    perspectiveZoom,
    navigation: {
      pose: {
        position: {
          voxelCoordinates: positionReal
            ? [0, 1, 2].map(idx => position[idx] / voxelSize[idx])
            : position,
          voxelSize
        },
        orientation,
      },
      zoomFactor: zoom
    }
  }
}

@Injectable({
  providedIn: 'root',
})

export class ViewerStateControllerUseEffect implements OnDestroy {

  private subscriptions: Subscription[] = []

  private selectedRegions$: Observable<any[]>

  @Effect()
  public init$ = this.pureService.initFetchTemplate$.pipe(
    map(fetchedTemplate => {
      return {
        type: FETCHED_TEMPLATE,
        fetchedTemplate,
      }
    }),
  )

  @Effect()
  public onSelectAtlasSelectTmplParc$ = this.actions$.pipe(
    ofType(viewerStateSelectAtlas.type),
    withLatestFrom(
      this.store$.pipe(
        select(viewerStateFetchedTemplatesSelector),
        startWith([])
      ),
      this.store$.pipe(
        select(viewerStateFetchedAtlasesSelector),
        startWith([])
      )
    ),
    map(([action, fetchedTemplates, fetchedAtlases ])=> {

      const atlas = fetchedAtlases.find(a => a['@id'] === (action as any).atlas['@id'])
      if (!atlas) {
        return generalActionError({
          message: CONST.ATLAS_NOT_FOUND
        })
      }
      /**
       * selecting atlas means selecting the first available templateSpace
       */
      const templateTobeSelected = atlas.templateSpaces[0]
      const templateSpaceId = templateTobeSelected['@id']
      
      const parcellationId = (
        templateTobeSelected.availableIn.find(p => !!p.baseLayer) ||
        templateTobeSelected.availableIn[0]
      )['@id']
        
      const templateSelected = fetchedTemplates.find(t => templateSpaceId === t['@id'])
      if (!templateSelected) {
        return generalActionError({
          message: CONST.TEMPLATE_NOT_FOUND
        })
      }
      const parcellationSelected = templateSelected.parcellations.find(p => p['@id'] === parcellationId)
      return viewerStateNewViewer({
        selectTemplate: templateSelected,
        selectParcellation: parcellationSelected
      })
    })
  )

  /**
   * on region selected change (clear, select, or change selection), clear selected dataset ids
   */
  @Effect()
  public clearShownDatasetIdOnRegionClear: Observable<any> = this.store$.pipe(
    select(viewerStateSelectedRegionsSelector),
    mapTo(
      uiActionHideAllDatasets()
    )
  )

  @Effect()
  public selectParcellation$: Observable<any>

  private selectTemplateIntent$: Observable<any> = merge(
    this.actions$.pipe(
      ofType(viewerStateSelectTemplateWithId.type),
      map(({ payload, config }) => {
        return {
          templateId: payload['@id'],
          parcellationId: config && config['selectParcellation'] && config['selectParcellation']['@id']
        }
      })
    ),
    this.actions$.pipe(
      ofType(viewerStateSelectTemplateWithName),
      withLatestFrom(this.store$.pipe(
        select(viewerStateFetchedTemplatesSelector)
      )),
      map(([ action, fetchedTemplates ]) => {
        const templateName = (action as any).payload.name
        const foundTemplate = fetchedTemplates.find(t => t.name === templateName)
        return foundTemplate && foundTemplate['@id']
      }),
      filter(v => !!v),
      map(templateId => {
        return { templateId, parcellationId: null }
      })
    )
  )

  @Effect()
  public selectTemplate$: Observable<any> = this.selectTemplateIntent$.pipe(
    withLatestFrom(
      this.store$.pipe(
        select(viewerStateFetchedTemplatesSelector)
      ),
      this.store$.pipe(
        select(viewerStateSelectedParcellationSelector)
      )
    ),
    map(([ { templateId, parcellationId }, fetchedTemplates, parcellationSelected ]) => {
      /**
       * find the correct template & parcellation from their IDs
       */

      /**
       * for template, just look for the new id in fetched templates
       */
      const newTemplateTobeSelected = fetchedTemplates.find(t => t['@id'] === templateId)
      if (!newTemplateTobeSelected) {
        return {
          selectTemplate: null,
          selectParcellation: null,
          errorMessage: `Selected templateId ${templateId} not found.`
        }
      }

      /**
       * for parcellation,
       * if new parc id is defined, try to find the corresponding parcellation in the new template
       * if above fails, try to find the corresponding parcellation of the currently selected parcellation
       * if the above fails, select the first parcellation in the new template
       */
      const selectParcellationWithTemplate = (parcellationId && newTemplateTobeSelected['parcellations'].find(p => p['@id'] === parcellationId))
        || (parcellationSelected && parcellationSelected['@id'] && newTemplateTobeSelected['parcellations'].find(p => p['@id'] === parcellationSelected['@id']))
        || newTemplateTobeSelected.parcellations[0]

      return {
        selectTemplate: newTemplateTobeSelected,
        selectParcellation: selectParcellationWithTemplate
      }
    }),
    withLatestFrom(
      this.store$.pipe(
        select(viewerStateSelectedTemplateSelector),
        startWith(null as any),
      ),
      this.store$.pipe(
        select(viewerStateNavigationStateSelector),
        startWith(null as any),
      )
    ),
    switchMap(([{ selectTemplate, selectParcellation, errorMessage }, lastSelectedTemplate, navigation]) => {
      /**
       * if selectTemplate is undefined (cannot find template with id)
       */
      if (errorMessage) {
        return of(generalActionError({
          message: errorMessage || 'Switching template error.',
        }))
      }
      /**
       * if there were no template selected last
       * simply return selectTemplate object
       */
      if (!lastSelectedTemplate) {
        return of(viewerStateNewViewer({
          selectParcellation,
          selectTemplate,
        }))
      }

      /**
       * if there were template selected last, extract navigation info
       */
      const previousNavigation = (navigation && Object.keys(navigation).length > 0 && navigation) || cvtNehubaConfigToNavigationObj(lastSelectedTemplate.nehubaConfig?.dataset?.initialNgState)
      return this.coordinatesTransformation.getPointCoordinatesForTemplate(lastSelectedTemplate.name, selectTemplate.name, previousNavigation.position).pipe(
        map(({ status, result }) => {

          /**
           * if getPointCoordinatesForTemplate returns error, simply load the temp/parc
           */
          if (status === 'error') {
            return viewerStateNewViewer({
              selectParcellation,
              selectTemplate,
            })
          }

          /**
           * otherwise, copy the nav state to templateSelected
           * deepclone of json object is required, or it will mutate the fetchedTemplate
           * setting navigation sometimes creates a race con, as creating nehubaViewer is not sync
           */
          const deepCopiedState = JSON.parse(JSON.stringify(selectTemplate))
          const initialNgState = deepCopiedState.nehubaConfig.dataset.initialNgState

          const newInitialNgState = cvtNavigationObjToNehubaConfig({
            ...previousNavigation,
            position: result
          }, initialNgState)

          /**
           * mutation of initialNgState is expected here
           */
          deepCopiedState.nehubaConfig.dataset.initialNgState = {
            ...initialNgState,
            ...newInitialNgState
          }

          return viewerStateNewViewer({
            selectTemplate: deepCopiedState,
            selectParcellation,
          })
        })
      )
    })
  )

  @Effect()
  public toggleRegionSelection$: Observable<any>

  @Effect()
  public navigateToRegion$: Observable<any>

  @Effect()
  public onTemplateSelectClearStandAloneVolumes$: Observable<any>

  @Effect()
  public onTemplateSelectUnsetAllClearQueues$: Observable<any> = this.store$.pipe(
    select(viewerStateSelectedTemplateSelector),
    withLatestFrom(this.store$.pipe(
      select(ngViewerSelectorClearViewEntries)
    )),
    map(([_, clearViewQueue]) => {
      const newVal = {}
      for (const key of clearViewQueue) {
        newVal[key] = false
      }
      return ngViewerActionClearView({
        payload: newVal
      })
    })
  )

  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private pureService: PureContantService,
    private coordinatesTransformation: TemplateCoordinatesTransformation
  ) {
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1),
    )

    this.selectedRegions$ = viewerState$.pipe(
      select('regionsSelected'),
      distinctUntilChanged(),
    )

    this.onTemplateSelectClearStandAloneVolumes$ = this.store$.pipe(
      select(viewerStateSelectedTemplateSelector),
      distinctUntilChanged(),
      mapTo({ type: CLEAR_STANDALONE_VOLUMES })
    )

    /**
     * merge all sources of selecting parcellation into parcellation id
     */
    this.selectParcellation$ = merge(

      /**
       * listening on action
       */

      this.actions$.pipe(
        ofType(viewerStateHelperSelectParcellationWithId.type),
        map(({ payload }) => payload['@id'])
      ),

      /**
       * deprecated method...
       * finding id from name
       */
      this.actions$.pipe(
        ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.SELECT_PARCELLATION_WITH_NAME),
        withLatestFrom(viewerState$.pipe(
          select('templateSelected')
        )),
        map(([ action, templateSelected ]) => {
          const parcellationName = (action as any).payload.name
          const foundParcellation = templateSelected.parcellations.find(p => p.name === parcellationName)
          return foundParcellation && foundParcellation['@id']
        }),
        filter(v => !!v)
      )
    ).pipe(
      withLatestFrom(viewerState$.pipe(
        select('templateSelected'),
      )),
      map(([id, templateSelected]) => {
        const { parcellations: availableParcellations } = templateSelected
        const newParcellation = availableParcellations.find(t => t['@id'] === id)
        if (!newParcellation) {
          return generalActionError({
            message: 'Selected parcellation not found.'
          })
        }
        return {
          type: SELECT_PARCELLATION,
          selectParcellation: newParcellation,
        }
      })
    )

    this.navigateToRegion$ = this.actions$.pipe(
      ofType(viewerStateNavigateToRegion),
      map(action => {
        const { payload = {} } = action as ViewerStateAction
        const { region } = payload
        if (!region) {
          return generalActionError({
            message: `Go to region: region not defined`
          })
        }

        const { position } = region
        if (!position) {
          return generalActionError({
            message: `${region.name} - does not have a position defined`
          })
        }

        if (!verifyPositionArg(position)){
          return generalActionError({
            message: `${region.name} has malformed position property: ${JSON.stringify(position)}`
          })
        }

        return {
          type: CHANGE_NAVIGATION,
          navigation: {
            position,
            animation: {},
          },
        }
      }),
    )

    this.toggleRegionSelection$ = this.actions$.pipe(
      ofType(viewerStateToggleRegionSelect.type),
      withLatestFrom(this.selectedRegions$),
      map(([action, regionsSelected]) => {

        const { payload = {} } = action as ViewerStateAction
        const { region } = payload

        /**
         * if region does not have labelIndex (not tree leaf), for now, return error
         */
        if (!region.labelIndex) {
          return generalActionError({
            message: 'Currently, only regions at the lowest hierarchy can be selected.'
          })
        }

        /**
         * if the region is already selected, deselect it
         * if the region is not yet selected, deselect any existing region, and select this region
         */
        const roiIsSelected = !!regionsSelected.find(r => r.name === region.name)
        return {
          type: SELECT_REGIONS,
          selectRegions: roiIsSelected
            ? []
            : [ region ]
        }
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}

interface ViewerStateAction extends Action {
  payload: any
  config: any
}
