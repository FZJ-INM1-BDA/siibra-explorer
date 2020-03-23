import {EventEmitter, Input, Output} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {NEWVIEWER, SET_CONNECTIVITY_REGION} from "src/services/state/viewerState.store";
import {
  EXPAND_SIDE_PANEL_CURRENT_VIEW,
  IavRootStoreInterface, OPEN_SIDE_PANEL,
  SHOW_SIDE_PANEL_CONNECTIVITY,
} from "src/services/stateStore.service";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "../viewerStateController/viewerState.base";
import {distinctUntilChanged, shareReplay} from "rxjs/operators";
import {Observable} from "rxjs";

export class RegionBase {

  @Input()
  public region: any

  @Input()
  public isSelected: boolean = false

  @Input() public hasConnectivity: boolean

  @Output() public closeRegionMenu: EventEmitter<boolean> = new EventEmitter()

  public loadedTemplate$: Observable<any[]>
  public templateSelected$: Observable<any[]>
  public parcellationSelected$: Observable<any[]>

  protected loadedTemplates: any[]
  protected selectedTemplate: any
  protected selectedParcellation: any
  public sameRegionTemplate: any[] = []

  private parcellationRegions: any[] = []

  constructor(
    private store$: Store<IavRootStoreInterface>,
  ) {

    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1),
    )

    this.loadedTemplate$ = viewerState$.pipe(
      select('fetchedTemplates'),
      distinctUntilChanged()
    )

    this.templateSelected$ = viewerState$.pipe(
      select('templateSelected'),
      distinctUntilChanged(),
    )

    this.parcellationSelected$ = viewerState$.pipe(
      select('parcellationSelected'),
      distinctUntilChanged(),
    )
  }

  public navigateToRegion() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.NAVIGATETO_REGION,
      payload: { region },
    })
  }

  public toggleRegionSelected() {
    this.closeRegionMenu.emit()
    const { region } = this
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.TOGGLE_REGION_SELECT,
      payload: { region },
    })
  }

  public showConnectivity(regionName) {
    this.closeRegionMenu.emit()
    // ToDo trigger side panel opening with effect
    this.store$.dispatch({type: OPEN_SIDE_PANEL})
    this.store$.dispatch({type: EXPAND_SIDE_PANEL_CURRENT_VIEW})
    this.store$.dispatch({type: SHOW_SIDE_PANEL_CONNECTIVITY})

    this.store$.dispatch({
      type: SET_CONNECTIVITY_REGION,
      connectivityRegion: regionName,
    })
  }


  getDifferentTemplatesSameRegion() {
    this.sameRegionTemplate = []
    this.loadedTemplates.forEach(template => {
      if (this.selectedTemplate.name !== template.name) {
        template.parcellations.forEach(parcellation => {
          this.parcellationRegions = []
          this.getAllRegionsFromParcellation(parcellation.regions)
          this.parcellationRegions.forEach(pr => {
            if (JSON.stringify(pr.fullId) === JSON.stringify(this.region.fullId)) {
              const baseAreaHemisphere =
                  this.region.name.includes(' - right hemisphere')? 'right' :
                    this.region.name.includes(' - left hemisphere')? 'left'
                      : null
              const areaHemisphere =
                  pr.name.includes(' - right hemisphere')? 'right'
                    : pr.name.includes(' - left hemisphere')? 'left'
                      : null
              const sameRegionSpace = {template: template, parcellation: parcellation, region: pr}
              if (!this.sameRegionTemplate.map(sr => sr.template).includes(template)) {
                if (!(baseAreaHemisphere && areaHemisphere && baseAreaHemisphere !== areaHemisphere)) {
                  this.sameRegionTemplate.push(sameRegionSpace)
                }
              }
            }
          })
        })
      }
    })
  }

  changeView(index) {
    this.closeRegionMenu.emit()

    this.store$.dispatch({
      type : NEWVIEWER,
      selectTemplate : this.sameRegionTemplate[index].template,
      selectParcellation : this.sameRegionTemplate[index].parcellation,
      navigation: {position: this.sameRegionTemplate[index].region.position},
    })
  }


  public getAllRegionsFromParcellation = (regions) => {
    for (const region of regions) {
      if (region.children && region.children.length) {
        this.getAllRegionsFromParcellation(region.children)
      } else {
        this.parcellationRegions.push(region)
      }
    }
  }






}
