import { ViewChild, TemplateRef, OnInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged, shareReplay, filter } from "rxjs/operators";
import { SELECT_REGIONS, USER_CONFIG_ACTION_TYPES } from "src/services/stateStore.service";
import { MatSelectChange, MatBottomSheet, MatBottomSheetRef } from "@angular/material";
import { DialogService } from "src/services/dialogService.service";
import { RegionSelection } from "src/services/state/userConfigState.store";


const compareWith = (o, n) => !o || !n
? false
: o.name === n.name

export class ViewerStateBase implements OnInit{

  @ViewChild('savedRegionBottomSheetTemplate', {read:TemplateRef}) savedRegionBottomSheetTemplate: TemplateRef<any>

  public focused: boolean = false

  private subscriptions: Subscription[] = []

  public availableTemplates$: Observable<any[]>
  public availableParcellations$: Observable<any[]>

  public templateSelected$: Observable<any>
  public parcellationSelected$: Observable<any>
  public regionsSelected$: Observable<any>

  public savedRegionsSelections$: Observable<any[]>

  private dismissToastHandler: () => void

  public compareWith = compareWith

  private savedRegionBottomSheetRef: MatBottomSheetRef

  constructor(
    private store$: Store<any>,
    private dialogService: DialogService,
    private bottomSheet: MatBottomSheet
  ){
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1)
    )

    this.savedRegionsSelections$ = this.store$.pipe(
      select('userConfigState'),
      select('savedRegionsSelection'),
      shareReplay(1)
    )

    this.templateSelected$ = viewerState$.pipe(
      select('templateSelected'),
      distinctUntilChanged()
    )

    this.parcellationSelected$ = viewerState$.pipe(
      select('parcellationSelected'),
      distinctUntilChanged(),
      shareReplay(1)
    )

    this.regionsSelected$ = viewerState$.pipe(
      select('regionsSelected'),
      distinctUntilChanged(),
      shareReplay(1)
    )

    this.availableTemplates$ = viewerState$.pipe(
      select('fetchedTemplates'),
      distinctUntilChanged()
    )

    this.availableParcellations$ = this.templateSelected$.pipe(
      select('parcellations')
    )
    
  }

  ngOnInit(){
    this.subscriptions.push(
      this.savedRegionsSelections$.pipe(
        filter(srs => srs.length === 0)
      ).subscribe(() => this.savedRegionBottomSheetRef && this.savedRegionBottomSheetRef.dismiss())
    )
  }

  handleTemplateChange(event:MatSelectChange){
    
    this.store$.dispatch({
      type: ACTION_TYPES.SELECT_TEMPLATE_WITH_NAME,
      payload: {
        name: event.value
      }
    })
  }

  handleParcellationChange(event:MatSelectChange){
    if (!event.value) return
    this.store$.dispatch({
      type: ACTION_TYPES.SELECT_PARCELLATION_WITH_NAME,
      payload: {
        name: event.value
      }
    })
  }

  loadSavedRegion(event:MouseEvent, savedRegionsSelection:RegionSelection){
    this.store$.dispatch({
      type: USER_CONFIG_ACTION_TYPES.LOAD_REGIONS_SELECTION,
      payload: {
        savedRegionsSelection
      }
    })
  }

  public editSavedRegion(event: MouseEvent, savedRegionsSelection: RegionSelection){
    event.preventDefault()
    event.stopPropagation()
    this.dialogService.getUserInput({
      defaultValue: savedRegionsSelection.name,
      placeholder: `Enter new name`,
      title: 'Edit name',
      iconClass: null
    }).then(name => {
      if (!name) throw new Error('user cancelled')
      this.store$.dispatch({
        type: USER_CONFIG_ACTION_TYPES.UPDATE_REGIONS_SELECTION,
        payload: {
          ...savedRegionsSelection,
          name
        }
      })
    }).catch(e => {
      // TODO catch user cancel
    })
  }
  public removeSavedRegion(event: MouseEvent, savedRegionsSelection: RegionSelection){
    event.preventDefault()
    event.stopPropagation()
    this.store$.dispatch({
      type: USER_CONFIG_ACTION_TYPES.DELETE_REGIONS_SELECTION,
      payload: {
        ...savedRegionsSelection
      }
    })
  }


  displayActiveParcellation(parcellation:any){
    return `<div class="d-flex"><small>Parcellation</small> <small class = "flex-grow-1 mute-text">${parcellation ? '(' + parcellation.name + ')' : ''}</small> <span class = "fas fa-caret-down"></span></div>`
  }

  displayActiveTemplate(template: any) {
    return `<div class="d-flex"><small>Template</small> <small class = "flex-grow-1 mute-text">${template ? '(' + template.name + ')' : ''}</small> <span class = "fas fa-caret-down"></span></div>`
  }

  public loadSelection(event: MouseEvent){
    this.focused = true
    
    this.savedRegionBottomSheetRef = this.bottomSheet.open(this.savedRegionBottomSheetTemplate)
    this.savedRegionBottomSheetRef.afterDismissed()
      .subscribe(val => {
        
      }, error => {

      }, () => {
        this.focused = false
        this.savedRegionBottomSheetRef = null
      })
  }

  public saveSelection(event: MouseEvent){
    this.focused = true
    this.dialogService.getUserInput({
      defaultValue: `Saved Region`,
      placeholder: `Name the selection`,
      title: 'Save region selection',
      iconClass: 'far fa-bookmark'
    })
      .then(name => {
        if (!name) throw new Error('User cancelled')
        this.store$.dispatch({
          type: USER_CONFIG_ACTION_TYPES.SAVE_REGIONS_SELECTION,
          payload: { name }
        })
      })
      .catch(e => {
        /**
         * USER CANCELLED, HANDLE
         */
      })
      .finally(() => this.focused = false)
  }

  public deselectAllRegions(event: MouseEvent){
    this.store$.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

}

const ACTION_TYPES = {
  SINGLE_CLICK_ON_REGIONHIERARCHY: 'SINGLE_CLICK_ON_REGIONHIERARCHY',
  DOUBLE_CLICK_ON_REGIONHIERARCHY: 'DOUBLE_CLICK_ON_REGIONHIERARCHY',
  SELECT_TEMPLATE_WITH_NAME: 'SELECT_TEMPLATE_WITH_NAME',
  SELECT_PARCELLATION_WITH_NAME: 'SELECT_PARCELLATION_WITH_NAME',

  TOGGLE_REGION_SELECT: 'TOGGLE_REGION_SELECT',
  NAVIGATETO_REGION: 'NAVIGATETO_REGION'
}

export const VIEWERSTATE_CONTROLLER_ACTION_TYPES = ACTION_TYPES
