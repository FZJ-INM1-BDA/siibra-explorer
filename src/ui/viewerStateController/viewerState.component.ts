import { Component, ViewChild, TemplateRef, OnInit } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, Subject, combineLatest, Subscription } from "rxjs";
import { distinctUntilChanged, shareReplay, bufferTime, filter, map, withLatestFrom, delay, take, tap } from "rxjs/operators";
import { SELECT_REGIONS, USER_CONFIG_ACTION_TYPES } from "src/services/stateStore.service";
import { DESELECT_REGIONS, CHANGE_NAVIGATION } from "src/services/state/viewerState.store";
import { ToastService } from "src/services/toastService.service";
import { getSchemaIdFromName } from "src/util/pipes/templateParcellationDecoration.pipe";
import { MatDialog, MatSelectChange, MatBottomSheet, MatBottomSheetRef } from "@angular/material";
import { ExtraButton } from "src/components/radiolist/radiolist.component";
import { DialogService } from "src/services/dialogService.service";
import { RegionSelection } from "src/services/state/userConfigState.store";

const compareWith = (o, n) => !o || !n
  ? false
  : o.name === n.name

@Component({
  selector: 'viewer-state-controller',
  templateUrl: './viewerState.template.html',
  styleUrls: [
    './viewerState.style.css'
  ]
})

export class ViewerStateController implements OnInit{

  @ViewChild('publicationTemplate', {read:TemplateRef}) publicationTemplate: TemplateRef<any>
  @ViewChild('savedRegionBottomSheetTemplate', {read:TemplateRef}) savedRegionBottomSheetTemplate: TemplateRef<any>

  public focused: boolean = false

  private subscriptions: Subscription[] = []

  public availableTemplates$: Observable<any[]>
  public availableParcellations$: Observable<any[]>

  public templateSelected$: Observable<any>
  public parcellationSelected$: Observable<any>
  public regionsSelected$: Observable<any>

  public savedRegionsSelections$: Observable<any[]>

  public focusedDatasets$: Observable<any[]>
  private userFocusedDataset$: Subject<any> = new Subject()
  private dismissToastHandler: () => void

  public compareWith = compareWith

  private savedRegionBottomSheetRef: MatBottomSheetRef

  constructor(
    private store$: Store<any>,
    private toastService: ToastService,
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
    
    this.focusedDatasets$ = this.userFocusedDataset$.pipe(
      filter(v => !!v),
      withLatestFrom(
        combineLatest(this.templateSelected$, this.parcellationSelected$)
      ),
    ).pipe(
      map(([userFocusedDataset, [selectedTemplate, selectedParcellation]]) => {
        const { type, ...rest } = userFocusedDataset
        if (type === 'template') return { ...selectedTemplate,  ...rest}
        if (type === 'parcellation') return { ...selectedParcellation, ...rest }
        return { ...rest }
      }),
      bufferTime(100),
      filter(arr => arr.length > 0),
      /**
       * merge properties field with the root level
       * with the prop in properties taking priority
       */
      map(arr => arr.map(item => {
        const { properties } = item
        return {
          ...item,
          ...properties
        }
      })),
      shareReplay(1)
    )
  }

  ngOnInit(){
    this.subscriptions.push(
      this.savedRegionsSelections$.pipe(
        filter(srs => srs.length === 0)
      ).subscribe(() => this.savedRegionBottomSheetRef && this.savedRegionBottomSheetRef.dismiss())
    )
    this.subscriptions.push(
      this.focusedDatasets$.subscribe(() => this.dismissToastHandler && this.dismissToastHandler())
    )
    this.subscriptions.push(
      this.focusedDatasets$.pipe(
        /**
         * creates the illusion that the toast complete disappears before reappearing
         */
        delay(100)
      ).subscribe(() => this.dismissToastHandler = this.toastService.showToast(this.publicationTemplate, {
        dismissable: true,
        timeout:7000
      }))
    )
  }

  handleActiveDisplayBtnClicked(event: MouseEvent, type: 'parcellation' | 'template', extraBtn: ExtraButton, inputItem:any = {}){
    const { name } = extraBtn
    const { kgSchema, kgId } = getSchemaIdFromName(name)
    this.userFocusedDataset$.next({
      ...inputItem,
      kgSchema,
      kgId
    })
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
      title: 'Edit name'
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
      title: 'Save region selection'
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

  public deselectRegion(event: MouseEvent, region: any){
    this.store$.dispatch({
      type: DESELECT_REGIONS,
      deselectRegions: [region]
    })
  }

  public gotoRegion(event: MouseEvent, region:any){
    if (region.position) {
      this.store$.dispatch({
        type: CHANGE_NAVIGATION,
        navigation: {
          position: region.position,
          animation: {}
        }
      })
    } else {
      /**
       * TODO convert to snack bar
       */
      this.toastService.showToast(`${region.name} does not have a position defined`, {
        timeout: 5000,
        dismissable: true
      })
    }
  }
}

const ACTION_TYPES = {
  SINGLE_CLICK_ON_REGIONHIERARCHY: 'SINGLE_CLICK_ON_REGIONHIERARCHY',
  DOUBLE_CLICK_ON_REGIONHIERARCHY: 'DOUBLE_CLICK_ON_REGIONHIERARCHY',
  SELECT_TEMPLATE_WITH_NAME: 'SELECT_TEMPLATE_WITH_NAME',
  SELECT_PARCELLATION_WITH_NAME: 'SELECT_PARCELLATION_WITH_NAME',
}

export const VIEWERSTATE_ACTION_TYPES = ACTION_TYPES
