import {EventEmitter, Input, Output} from "@angular/core";
import {select, Store} from "@ngrx/store";
import {SET_CONNECTIVITY_REGION} from "src/services/state/viewerState.store";
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

  getSameParcellationTemplates = () => {
    // Get All the templates which includes parcellation equal to selected parcellation
    // (E.g. if MNI 152 ICBM Jubrain is selected method returns MNI Colin 27)
    this.loadedTemplates.forEach(template => {
      if (this.selectedTemplate.name !== template.name
          && template.parcellations.map(p => p.name).includes(this.selectedParcellation.name)) {
        this.sameRegionTemplate.push(template.name)
      }
    })
    return null
  }

  bigBrainJubrainSwitch = () => {
    // If Jubrain or bigbrain is selected and clicked region is included in both of them
    // push template name to sameRegionTemplate to change template from menu
    this.loadedTemplates.forEach(template => {
      if(this.selectedTemplate.name === 'Big Brain (Histology)'
          && template.parcellations.map( p => p.name).includes('JuBrain Cytoarchitectonic Atlas')) {

        this.parcellationRegions = []

        this.getAllRegionsFromParcellation(template.parcellations.filter(p => p.name === 'JuBrain Cytoarchitectonic Atlas')[0].regions)
        this.parcellationRegions.forEach(pr => {
          if (!pr.name.includes(' - left hemisphere')) {
            if (pr.name.includes(' - right hemisphere')) pr.name = pr.name.replace(' - right hemisphere','')
            if (!this.sameRegionTemplate.includes(template.name)) this.sameRegionTemplate.push(template.name)
          }
        })
      }
      else if(this.selectedParcellation.name === 'JuBrain Cytoarchitectonic Atlas'
          && template.name === 'Big Brain (Histology)') {
        let exploreRegion = this.region.name
        if (exploreRegion.includes(' - right hemisphere')) exploreRegion = exploreRegion.replace(' - right hemisphere','')
        if (exploreRegion.includes(' - left hemisphere')) exploreRegion = exploreRegion.replace(' - left hemisphere','')
        this.getAllRegionsFromParcellation(template.parcellations.filter(p => p.name === 'Cytoarchitectonic Maps')[0].regions)
        if (this.parcellationRegions.map(pr => pr.name).includes(exploreRegion)) this.sameRegionTemplate.push(template.name)
      }
    })
  }

  selectTemplate(templateName) {
    this.closeRegionMenu.emit()
    this.store$.dispatch({
      type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.SELECT_TEMPLATE_WITH_NAME,
      payload: {
        name: templateName,
      },
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
