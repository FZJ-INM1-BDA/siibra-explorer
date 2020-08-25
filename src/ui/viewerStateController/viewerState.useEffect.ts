import { Injectable, OnDestroy } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Action, select, Store } from "@ngrx/store";
import { Observable, Subscription, of, merge } from "rxjs";
import {distinctUntilChanged, filter, map, shareReplay, withLatestFrom, switchMap, mapTo } from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { CHANGE_NAVIGATION, FETCHED_TEMPLATE, GENERAL_ACTION_TYPES, IavRootStoreInterface, NEWVIEWER, SELECT_PARCELLATION, SELECT_REGIONS } from "src/services/stateStore.service";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "./viewerState.base";
import {TemplateCoordinatesTransformation} from "src/services/templateCoordinatesTransformation.service";
import { CLEAR_STANDALONE_VOLUMES } from "src/services/state/viewerState.store";
import { viewerStateToggleRegionSelect, viewerStateHelperSelectParcellationWithId, viewerStateSelectTemplateWithId, viewerStateNavigateToRegion, viewerStateHelperStoreName } from "src/services/state/viewerState.store.helper";

@Injectable({
  providedIn: 'root',
})

export class ViewerStateControllerUseEffect implements OnDestroy {

  private subscriptions: Subscription[] = []

  private selectedRegions$: Observable<any[]>

  @Effect()
  public init$ = this.constantSerivce.initFetchTemplate$.pipe(
    map(fetchedTemplate => {
      return {
        type: FETCHED_TEMPLATE,
        fetchedTemplate,
      }
    }),
  )

  @Effect()
  public selectParcellation$: Observable<any>

  @Effect()
  public selectTemplate$: Observable<any>

  @Effect()
  public toggleRegionSelection$: Observable<any>

  @Effect()
  public navigateToRegion$: Observable<any>


  @Effect()
  public onTemplateSelectClearStandAloneVolumes$: Observable<any>

  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private constantSerivce: AtlasViewerConstantsServices,
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

    this.onTemplateSelectClearStandAloneVolumes$ = viewerState$.pipe(
      select('templateSelected'),
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
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: 'Selected parcellation not found.',
            },
          }
        }
        return {
          type: SELECT_PARCELLATION,
          selectParcellation: newParcellation,
        }
      })
    )

    /**
     * merge all sources into single stream consisting of template id's
     */
    this.selectTemplate$ = merge(
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
        ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.SELECT_TEMPLATE_WITH_NAME),
        withLatestFrom(viewerState$.pipe(
          select('fetchedTemplates')
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
    ).pipe(

      withLatestFrom(
        viewerState$
      ),
      switchMap(([{ templateId: newTemplateId, parcellationId: newParcellationId }, { templateSelected, fetchedTemplates, navigation, parcellationSelected }]) => {
        if (!templateSelected) {
          return of({
            newTemplateId,
            templateSelected: templateSelected,
            fetchedTemplates,
            translatedCoordinate: null,
            navigation,
            newParcellationId,
            parcellationSelected
          })
        }
        const position = (navigation && navigation.position) || [0, 0, 0]
        if (newTemplateId === templateSelected['@id']) return of(null)

        const newTemplateName = fetchedTemplates.find(t => t['@id'] === newTemplateId).name

        return this.coordinatesTransformation.getPointCoordinatesForTemplate(templateSelected.name, newTemplateName, position).pipe(
          map(({ status, statusText, result }) => {
            if (status === 'error') {
              return {
                newTemplateId,
                templateSelected: templateSelected,
                fetchedTemplates,
                translatedCoordinate: null,
                navigation,
                newParcellationId,
                parcellationSelected
              }
            }
            return {
              newTemplateId,
              templateSelected: templateSelected,
              fetchedTemplates,
              translatedCoordinate: result,
              navigation,
              newParcellationId,
              parcellationSelected
            }
          })
        )
      }),
      filter(v => !!v),
      map(({ newTemplateId, templateSelected, newParcellationId, fetchedTemplates, translatedCoordinate, navigation, parcellationSelected }) => {
        const newTemplateTobeSelected = fetchedTemplates.find(t => t['@id'] === newTemplateId)
        if (!newTemplateTobeSelected) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: 'Selected template not found.',
            },
          }
        }

        const selectParcellationWithTemplate = (newParcellationId && newTemplateTobeSelected['parcellations'].find(p => p['@id'] === newParcellationId))
          || (parcellationSelected && parcellationSelected['@id'] && newTemplateTobeSelected['parcellations'].find(p => p['@id'] === parcellationSelected['@id']))
          || newTemplateTobeSelected.parcellations[0]

        if (!translatedCoordinate) {
          return {
            type: NEWVIEWER,
            selectTemplate: newTemplateTobeSelected,
            selectParcellation: selectParcellationWithTemplate,
          }
        }
        const deepCopiedState = JSON.parse(JSON.stringify(newTemplateTobeSelected))
        const initNavigation = deepCopiedState.nehubaConfig.dataset.initialNgState.navigation

        const { zoom = null, orientation = null } = navigation || {}
        if (zoom) initNavigation.zoomFactor = zoom
        if (orientation) initNavigation.pose.orientation = orientation

        for (const idx of [0, 1, 2]) {
          initNavigation.pose.position.voxelCoordinates[idx] = translatedCoordinate[idx] / initNavigation.pose.position.voxelSize[idx]
        }

        return {
          type: NEWVIEWER,
          selectTemplate: deepCopiedState,
          selectParcellation: selectParcellationWithTemplate,
        }
      }),
    )


    this.navigateToRegion$ = this.actions$.pipe(
      ofType(viewerStateNavigateToRegion),
      map(action => {
        const { payload = {} } = action as ViewerStateAction
        const { region } = payload
        if (!region) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: `Go to region: region not defined`,
            },
          }
        }

        const { position } = region
        if (!position) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: `${region.name} - does not have a position defined`,
            },
          }
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
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: 'Currently, only regions at the lowest hierarchy can be selected.',
            },
          }
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
