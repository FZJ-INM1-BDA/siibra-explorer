import { OnInit, TemplateRef, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable, Subscription } from "rxjs";
import { distinctUntilChanged, filter, shareReplay } from "rxjs/operators";
import { DialogService } from "src/services/dialogService.service";
import { RegionSelection } from "src/services/state/userConfigState.store";
import { IavRootStoreInterface, SELECT_REGIONS, USER_CONFIG_ACTION_TYPES } from "src/services/stateStore.service";
import {MatSelectChange} from "@angular/material/select";
import {MatBottomSheet, MatBottomSheetRef} from "@angular/material/bottom-sheet";

const ACTION_TYPES = {
  SINGLE_CLICK_ON_REGIONHIERARCHY: 'SINGLE_CLICK_ON_REGIONHIERARCHY',
  DOUBLE_CLICK_ON_REGIONHIERARCHY: 'DOUBLE_CLICK_ON_REGIONHIERARCHY',
  SELECT_TEMPLATE_WITH_NAME: 'SELECT_TEMPLATE_WITH_NAME',
  SELECT_PARCELLATION_WITH_NAME: 'SELECT_PARCELLATION_WITH_NAME',

  NAVIGATETO_REGION: 'NAVIGATETO_REGION',
}

export class ViewerStateBase implements OnInit {

  @ViewChild('savedRegionBottomSheetTemplate', {read: TemplateRef}) public savedRegionBottomSheetTemplate: TemplateRef<any>

  public focused: boolean = false

  private subscriptions: Subscription[] = []

  public standaloneVolumes$: Observable<any[]>

  public availableTemplates$: Observable<any[]>
  public availableParcellations$: Observable<any[]>

  public templateSelected$: Observable<any>
  public parcellationSelected$: Observable<any>
  public regionsSelected$: Observable<any>

  public savedRegionsSelections$: Observable<any[]>

  private savedRegionBottomSheetRef: MatBottomSheetRef

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private dialogService: DialogService,
    private bottomSheet: MatBottomSheet,
  ) {
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1),
    )

    this.savedRegionsSelections$ = this.store$.pipe(
      select('userConfigState'),
      select('savedRegionsSelection'),
      shareReplay(1),
    )

    this.templateSelected$ = viewerState$.pipe(
      select('templateSelected'),
      distinctUntilChanged(),
    )

    this.parcellationSelected$ = viewerState$.pipe(
      select('parcellationSelected'),
      distinctUntilChanged(),
      shareReplay(1),
    )

    this.regionsSelected$ = viewerState$.pipe(
      select('regionsSelected'),
      distinctUntilChanged(),
      shareReplay(1),
    )

    this.standaloneVolumes$ = viewerState$.pipe(
      select('standaloneVolumes'),
      distinctUntilChanged(),
      shareReplay(1)
    )

    this.availableTemplates$ = viewerState$.pipe(
      select('fetchedTemplates'),
      distinctUntilChanged()
    )

    this.availableParcellations$ = this.templateSelected$.pipe(
      select('parcellations'),
    )

  }

  public ngOnInit() {
    this.subscriptions.push(
      this.savedRegionsSelections$.pipe(
        filter(srs => srs.length === 0),
      ).subscribe(() => this.savedRegionBottomSheetRef && this.savedRegionBottomSheetRef.dismiss()),
    )
  }

  public handleTemplateChange(event: MatSelectChange) {

    this.store$.dispatch({
      type: ACTION_TYPES.SELECT_TEMPLATE_WITH_NAME,
      payload: {
        name: event.value,
      },
    })
  }

  public handleParcellationChange(event: MatSelectChange) {
    if (!event.value) { return }
    this.store$.dispatch({
      type: ACTION_TYPES.SELECT_PARCELLATION_WITH_NAME,
      payload: {
        name: event.value,
      },
    })
  }

  public loadSavedRegion(event: MouseEvent, savedRegionsSelection: RegionSelection) {
    this.store$.dispatch({
      type: USER_CONFIG_ACTION_TYPES.LOAD_REGIONS_SELECTION,
      payload: {
        savedRegionsSelection,
      },
    })
  }

  public editSavedRegion(event: MouseEvent, savedRegionsSelection: RegionSelection) {
    event.preventDefault()
    event.stopPropagation()
    this.dialogService.getUserInput({
      defaultValue: savedRegionsSelection.name,
      placeholder: `Enter new name`,
      title: 'Edit name',
      iconClass: null,
    }).then(name => {
      if (!name) { throw new Error('user cancelled') }
      this.store$.dispatch({
        type: USER_CONFIG_ACTION_TYPES.UPDATE_REGIONS_SELECTION,
        payload: {
          ...savedRegionsSelection,
          name,
        },
      })
    }).catch(e => {
      // TODO catch user cancel
    })
  }
  public removeSavedRegion(event: MouseEvent, savedRegionsSelection: RegionSelection) {
    event.preventDefault()
    event.stopPropagation()
    this.store$.dispatch({
      type: USER_CONFIG_ACTION_TYPES.DELETE_REGIONS_SELECTION,
      payload: {
        ...savedRegionsSelection,
      },
    })
  }

  public trackByFn = ({ name }) => name

  public loadSelection(_event: MouseEvent) {
    this.focused = true

    this.savedRegionBottomSheetRef = this.bottomSheet.open(this.savedRegionBottomSheetTemplate)
    this.savedRegionBottomSheetRef.afterDismissed()
      .subscribe(null, null, () => {
        this.focused = false
        this.savedRegionBottomSheetRef = null
      })
  }

  public saveSelection(_event: MouseEvent) {
    this.focused = true
    this.dialogService.getUserInput({
      defaultValue: `Saved Region`,
      placeholder: `Name the selection`,
      title: 'Save region selection',
      iconClass: 'far fa-bookmark',
    })
      .then(name => {
        if (!name) { throw new Error('User cancelled') }
        this.store$.dispatch({
          type: USER_CONFIG_ACTION_TYPES.SAVE_REGIONS_SELECTION,
          payload: { name },
        })
      })
      .catch(e => {
        /**
         * TODO USER CANCELLED, HANDLE
         */
      })
      .finally(() => this.focused = false)
  }

  public deselectAllRegions(_event: MouseEvent) {
    this.store$.dispatch({
      type: SELECT_REGIONS,
      selectRegions: [],
    })
  }

}

export const VIEWERSTATE_CONTROLLER_ACTION_TYPES = ACTION_TYPES

