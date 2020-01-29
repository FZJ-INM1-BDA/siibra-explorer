import { Injectable, OnDestroy, OnInit } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { Action, select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import {distinctUntilChanged, filter, map, mergeMap, shareReplay, withLatestFrom} from "rxjs/operators";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { CHANGE_NAVIGATION, FETCHED_TEMPLATE, GENERAL_ACTION_TYPES, IavRootStoreInterface, isDefined, NEWVIEWER, SELECT_PARCELLATION, SELECT_REGIONS } from "src/services/stateStore.service";
import { UIService } from "src/services/uiService.service";
import { regionFlattener } from "src/util/regionFlattener";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "./viewerState.base";
import {TemplateCoordinatesTransformation} from "src/services/templateCoordinatesTransformation.service";

@Injectable({
  providedIn: 'root',
})

export class ViewerStateControllerUseEffect implements OnInit, OnDestroy {

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
  public selectTemplateWithName$: Observable<any>

  @Effect()
  public selectParcellationWithName$: Observable<any>

  /**
   * Determines how single click on region hierarchy will affect view
   */
  @Effect()
  public singleClickOnHierarchy$: Observable<any>

  /**
   * Determines how double click on region hierarchy will effect view
   */
  @Effect()
  public doubleClickOnHierarchy$: Observable<any>

  @Effect()
  public toggleRegionSelection$: Observable<any>

  @Effect()
  public navigateToRegion$: Observable<any>

  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private uiService: UIService,
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

    this.selectParcellationWithName$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.SELECT_PARCELLATION_WITH_NAME),
      map(action => {
        const { payload = {} } = action as ViewerStateAction
        const { name } = payload
        return name
      }),
      filter(name => !!name),
      withLatestFrom(viewerState$.pipe(
        select('parcellationSelected'),
      )),
      filter(([name,  parcellationSelected]) => {
        if (parcellationSelected && parcellationSelected.name === name) { return false }
        return true
      }),
      map(([name]) => name),
      withLatestFrom(viewerState$.pipe(
        select('templateSelected'),
      )),
      map(([name, templateSelected]) => {

        const { parcellations: availableParcellations } = templateSelected
        const newParcellation = availableParcellations.find(t => t.name === name)
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
      }),
    )

    this.selectTemplateWithName$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.SELECT_TEMPLATE_WITH_NAME),
      map(action => {
        const { payload = {} } = action as ViewerStateAction
        const { name } = payload
        return name
      }),
      filter(name => !!name),
      withLatestFrom(viewerState$.pipe(
        select('templateSelected'),
      )),
      filter(([name,  templateSelected]) => {
        if (templateSelected && templateSelected.name === name) { return false }
        return true
      }),
      withLatestFrom(
        viewerState$.pipe(
          select('fetchedTemplates'),
        ),
        viewerState$.pipe(
          select('navigation'),
        ),
      ),
      mergeMap(([[name, templateSelected], availableTemplates, navigation]) =>
        this.coordinatesTransformation.getPointCoordinatesForTemplate(templateSelected.name, name, navigation.position)
          .then(res => {
            navigation.position = res
            return {
              name: name,
              templateSelected: templateSelected,
              availableTemplates: availableTemplates,
              coordinates: res,
              navigation: navigation
            }
          })
          .catch(() => {
            return {
              name: name,
              templateSelected: templateSelected,
              availableTemplates: availableTemplates,
              coordinates: null,
              navigation: null
            }
          })
      ),
      map(({name, templateSelected, availableTemplates, coordinates, navigation}) => {
        const newTemplateTobeSelected = availableTemplates.find(t => t.name === name)
        if (!newTemplateTobeSelected) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: 'Selected template not found.',
            },
          }
        }

        if (!coordinates && !navigation)
          return {
            type: NEWVIEWER,
            selectTemplate: newTemplateTobeSelected,
            selectParcellation: newTemplateTobeSelected.parcellations[0],
          }

        const deepCopiedState = JSON.parse(JSON.stringify(newTemplateTobeSelected))
        const initNavigation = deepCopiedState.nehubaConfig.dataset.initialNgState.navigation

        initNavigation.zoomFactor = navigation.zoom
        initNavigation.pose.position.voxelCoordinates = coordinates.map((c, i) => c/initNavigation.pose.position.voxelSize[i])
        initNavigation.pose.orientation = navigation.orientation

        return {
          type: NEWVIEWER,
          selectTemplate: deepCopiedState,
          selectParcellation: newTemplateTobeSelected.parcellations[0],
        }
      }),
    )

    this.doubleClickOnHierarchy$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.DOUBLE_CLICK_ON_REGIONHIERARCHY),
      map(action => {
        return {
          ...action,
          type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.NAVIGATETO_REGION,
        }
      }),
    )

    this.navigateToRegion$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.NAVIGATETO_REGION),
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

    this.singleClickOnHierarchy$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.SINGLE_CLICK_ON_REGIONHIERARCHY),
      map(action => {
        return {
          ...action,
          type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.TOGGLE_REGION_SELECT,
        }
      }),
    )

    this.toggleRegionSelection$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.TOGGLE_REGION_SELECT),
      withLatestFrom(this.selectedRegions$),
      map(([action, regionsSelected]) => {

        const {payload = {}} = action as ViewerStateAction
        const { region } = payload

        const flattenedRegion = regionFlattener(region).filter(r => isDefined(r.labelIndex))
        const flattenedRegionNames = new Set(flattenedRegion.map(r => r.name))
        const selectedRegionNames = new Set(regionsSelected.map(r => r.name))
        const selectAll = flattenedRegion.every(r => !selectedRegionNames.has(r.name))
        return {
          type: SELECT_REGIONS,
          selectRegions: selectAll
            ? regionsSelected.concat(flattenedRegion)
            : regionsSelected.filter(r => !flattenedRegionNames.has(r.name)),
        }
      }),
    )
  }

  public ngOnInit() {
    this.subscriptions.push(
      this.doubleClickOnHierarchy$.subscribe(({ region } = {}) => {
        const { position } = region
        if (position) {
          this.store$.dispatch({
            type: CHANGE_NAVIGATION,
            navigation: {
              position,
              animation: {},
            },
          })
        } else {
          this.uiService.showMessage(`${region.name} does not have a position defined`)
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
