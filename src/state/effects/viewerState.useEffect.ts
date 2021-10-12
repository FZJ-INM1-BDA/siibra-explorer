import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Action, select, Store } from "@ngrx/store";
import { Observable, Subscription, of, merge } from "rxjs";
import { distinctUntilChanged, filter, map, shareReplay, withLatestFrom, switchMap, mapTo, startWith, catchError } from "rxjs/operators";
import { FETCHED_TEMPLATE, IavRootStoreInterface, SELECT_PARCELLATION, SELECT_REGIONS, generalActionError } from "src/services/stateStore.service";
import { TemplateCoordinatesTransformation } from "src/services/templateCoordinatesTransformation.service";
import { CLEAR_STANDALONE_VOLUMES } from "src/services/state/viewerState.store";
import { viewerStateToggleRegionSelect, viewerStateHelperSelectParcellationWithId, viewerStateSelectTemplateWithId, viewerStateNavigateToRegion, viewerStateSelectedTemplateSelector, viewerStateFetchedTemplatesSelector, viewerStateNewViewer, viewerStateSelectedParcellationSelector, viewerStateNavigationStateSelector, viewerStateSelectTemplateWithName, viewerStateSelectedRegionsSelector, viewerStateSelectAtlas } from "src/services/state/viewerState.store.helper";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState/selectors";
import { ngViewerActionClearView } from "src/services/state/ngViewerState/actions";
import { PureContantService } from "src/util";
import { CONST } from 'common/constants'
import { viewerStateFetchedAtlasesSelector, viewerStateGetSelectedAtlas } from "src/services/state/viewerState/selectors";
import { viewerStateChangeNavigation } from "src/services/state/viewerState/actions";
import { cvtNavigationObjToNehubaConfig } from 'src/viewerModule/nehuba/util'
import { getPosFromRegion } from "src/util/siibraApiConstants/fn";

const defaultPerspectiveZoom = 1e6
const defaultZoom = 1e6

export const defaultNavigationObject = {
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [0.5, -0.5, -0.5, 0.5],
  perspectiveZoom: defaultPerspectiveZoom,
  zoom: defaultZoom,
  position: [0, 0, 0],
  positionReal: true
}

export const defaultNehubaConfigObject = {
  perspectiveOrientation: [0.5, -0.5, -0.5, 0.5],
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
  const {
    navigation,
    perspectiveOrientation = defaultNavigationObject.perspectiveOrientation,
    perspectiveZoom = defaultNavigationObject.perspectiveZoom
  } = nehubaConfig || {}
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
    switchMap(action => this.pureService.allFetchingReady$.pipe(
      filter(v => !!v),
      mapTo(action)
    )),
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

      const { atlas: atlasObj } = action as any
      const atlas = fetchedAtlases.find(a => a['@id'] === atlasObj['@id'])
      if (!atlas) {
        return generalActionError({
          message: CONST.ATLAS_NOT_FOUND
        })
      }
      /**
       * selecting atlas means selecting the first available templateSpace
       */
      const targetTmplSpcId = atlasObj['template']?.['@id']
      const templateTobeSelected = (
        targetTmplSpcId
        && atlas.templateSpaces.find(t => t['@id'] === targetTmplSpcId)
      ) || atlas.templateSpaces[0]
      
      const templateSpaceId = templateTobeSelected['@id']
      const atlasTmpl = atlas.templateSpaces.find(t => t['@id'] === templateSpaceId)

      const templateSelected = fetchedTemplates.find(t => templateSpaceId === t['@id'])
      if (!templateSelected) {
        return generalActionError({
          message: CONST.TEMPLATE_NOT_FOUND
        })
      }

      const atlasParcs = atlasTmpl.availableIn
        .map(availP => atlas.parcellations.find(p => availP['@id'] === p['@id']))
        .filter(fullP => !!fullP)
      const atlasParc = atlasParcs.find(p => {
        if (!p.baseLayer) return false
        if (p['@version']) {
          return !p['@version']['@next']
        }
        return true
      }) || templateSelected.parcellations[0]
      const parcellationId = atlasParc && atlasParc['@id']
      const parcellationSelected = parcellationId && templateSelected.parcellations.find(p => p['@id'] === parcellationId)
      return viewerStateNewViewer({
        selectTemplate: templateSelected,
        selectParcellation: parcellationSelected
      })
    })
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
      map(action => action.payload?.region),
      withLatestFrom(
        this.store$.pipe(
          select(viewerStateGetSelectedAtlas)
        ),
        this.store$.pipe(
          select(viewerStateSelectedTemplateSelector)
        ),
        this.store$.pipe(
          select(viewerStateSelectedParcellationSelector)
        )
      ),
      switchMap(([ region,  selectedAtlas, selectedTemplate, selectedParcellation ]) => {
        if (!region || !selectedAtlas || !selectedTemplate || !selectedParcellation) {
          return of(
            generalActionError({
              message: `Go to region: region / atlas / template / parcellation not defined.`
            })
          )
        }
        return this.pureService.getRegionDetail(selectedAtlas['@id'], selectedParcellation['@id'], selectedTemplate['@id'], region).pipe(
          map(regDetail => {
            const pos = (() => {
              const position = getPosFromRegion(regDetail)
              if (!position) throw new Error(`centroid not found`)
              return position
            })()
            
            return viewerStateChangeNavigation({
              navigation: {
                position: pos,
                animation: {},
              }
            })
          }),
          catchError((err) => of(
            generalActionError({
              message: `Fetching region detail error: ${err}`
            })
          ))
        )
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
