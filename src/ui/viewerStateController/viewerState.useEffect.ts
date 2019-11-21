import { Subscription, Observable } from "rxjs";
import { Injectable, OnInit, OnDestroy } from "@angular/core";
import { Actions, ofType, Effect } from "@ngrx/effects";
import { Store, select, Action } from "@ngrx/store";
import { shareReplay, distinctUntilChanged, map, withLatestFrom, filter } from "rxjs/operators";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "./viewerState.base";
import { CHANGE_NAVIGATION, SELECT_REGIONS, NEWVIEWER, GENERAL_ACTION_TYPES, SELECT_PARCELLATION, isDefined, IavRootStoreInterface, FETCHED_TEMPLATE } from "src/services/stateStore.service";
import { regionFlattener } from "src/util/regionFlattener";
import { UIService } from "src/services/uiService.service";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";

@Injectable({
  providedIn: 'root'
})

export class ViewerStateControllerUseEffect implements OnInit, OnDestroy{

  private subscriptions: Subscription[] = []

  private selectedRegions$: Observable<any[]>


  @Effect()
  init$ = this.constantSerivce.initFetchTemplate$.pipe(
    map(fetchedTemplate => {
      return {
        type: FETCHED_TEMPLATE,
        fetchedTemplate
      }
    })
  )

  @Effect()
  selectTemplateWithName$: Observable<any>
  
  @Effect()
  selectParcellationWithName$: Observable<any>

  /**
   * Determines how single click on region hierarchy will affect view
   */
  @Effect()
  singleClickOnHierarchy$: Observable<any>

  /**
   * Determines how double click on region hierarchy will effect view
   */
  @Effect()
  doubleClickOnHierarchy$: Observable<any>

  @Effect()
  toggleRegionSelection$: Observable<any>

  @Effect()
  navigateToRegion$: Observable<any>

  constructor(
    private actions$: Actions,
    private store$: Store<IavRootStoreInterface>,
    private uiService: UIService,
    private constantSerivce: AtlasViewerConstantsServices
  ){
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1)
    )

    this.selectedRegions$ = viewerState$.pipe(
      select('regionsSelected'),
      distinctUntilChanged()
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
        select('parcellationSelected')
      )),
      filter(([name,  parcellationSelected]) => {
        if (parcellationSelected && parcellationSelected.name === name) return false
        return true
      }),
      map(([name,  _]) => name),
      withLatestFrom(viewerState$.pipe(
        select('templateSelected')
      )),
      map(([name, templateSelected]) => {

        const { parcellations: availableParcellations } = templateSelected
        const newParcellation = availableParcellations.find(t => t.name === name)
        if (!newParcellation) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: 'Selected parcellation not found.'
            }
          }
        }
        return {
          type: SELECT_PARCELLATION,
          selectParcellation: newParcellation
        }
      })
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
        select('templateSelected')
      )),
      filter(([name,  templateSelected]) => {
        if (templateSelected && templateSelected.name === name) return false
        return true
      }),
      map(([name,  templateSelected]) => name),
      withLatestFrom(viewerState$.pipe(
        select('fetchedTemplates')
      )),
      map(([name, availableTemplates]) => {
        const newTemplateTobeSelected = availableTemplates.find(t => t.name === name)
        if (!newTemplateTobeSelected) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: 'Selected template not found.'
            }
          }
        }
        return {
          type: NEWVIEWER,
          selectTemplate: newTemplateTobeSelected,
          selectParcellation: newTemplateTobeSelected.parcellations[0]
        }
      })
    )

    this.doubleClickOnHierarchy$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.DOUBLE_CLICK_ON_REGIONHIERARCHY),
      map(action => {
        return {
          ...action,
          type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.NAVIGATETO_REGION
        }
      })
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
              message: `Go to region: region not defined`
            }
          }
        }

        const { position } = region
        if (!position) {
          return {
            type: GENERAL_ACTION_TYPES.ERROR,
            payload: {
              message: `${region.name} - does not have a position defined`
            }
          }
        }

        return {
          type: CHANGE_NAVIGATION,
          navigation: {
            position,
            animation: {}
          }
        }
      })
    )

    this.singleClickOnHierarchy$ = this.actions$.pipe(
      ofType(VIEWERSTATE_CONTROLLER_ACTION_TYPES.SINGLE_CLICK_ON_REGIONHIERARCHY),
      map(action => {
        return {
          ...action,
          type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.TOGGLE_REGION_SELECT
        }
      })
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
            : regionsSelected.filter(r => !flattenedRegionNames.has(r.name))
        }
      })
    )
  }

  ngOnInit(){
    this.subscriptions.push(
      this.doubleClickOnHierarchy$.subscribe(({ region } = {}) => {
        const { position } = region
        if (position) {
          this.store$.dispatch({
            type: CHANGE_NAVIGATION,
            navigation: {
              position,
              animation: {}
            }
          })
        } else {
          this.uiService.showMessage(`${region.name} does not have a position defined`)
        }
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}

interface ViewerStateAction extends Action{
  payload: any
  config: any
}