import { Component, EventEmitter, Output, ViewChild, ElementRef, TemplateRef, Input, ChangeDetectionStrategy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { Observable, combineLatest } from "rxjs";
import { map, distinctUntilChanged, startWith, withLatestFrom, debounceTime, shareReplay, take, tap } from "rxjs/operators";
import { getMultiNgIdsRegionsLabelIndexMap, generateLabelIndexId } from "src/services/stateStore.service";
import { FormControl } from "@angular/forms";
import { MatAutocompleteSelectedEvent, MatDialog, AUTOCOMPLETE_OPTION_HEIGHT, AUTOCOMPLETE_PANEL_HEIGHT } from "@angular/material";
import { ADD_TO_REGIONS_SELECTION_WITH_IDS, SELECT_REGIONS, CHANGE_NAVIGATION } from "src/services/state/viewerState.store";
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from "../viewerState.base";
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { VIEWER_STATE_ACTION_TYPES } from "src/services/effect/effect";

const filterRegionBasedOnText = searchTerm => region => region.name.toLowerCase().includes(searchTerm.toLowerCase())
const compareFn = (it, item) => it.name === item.name

@Component({
  selector: 'region-text-search-autocomplete',
  templateUrl: './regionSearch.template.html',
  styleUrls: [
    './regionSearch.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RegionTextSearchAutocomplete{

  public compareFn = compareFn

  @Input() public showBadge: boolean = false
  @Input() public showAutoComplete: boolean = true

  @ViewChild('autoTrigger', {read: ElementRef}) autoTrigger: ElementRef 
  @ViewChild('regionHierarchyDialog', {read:TemplateRef}) regionHierarchyDialogTemplate: TemplateRef<any>

  public useMobileUI$: Observable<boolean>

  public selectedRegionLabelIndexSet: Set<string> = new Set()

  constructor(
    private store$: Store<any>,
    private dialog: MatDialog,
    private constantService: AtlasViewerConstantsServices
  ){

    this.useMobileUI$ = this.constantService.useMobileUI$

    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1)
    )

    this.regionsWithLabelIndex$ = viewerState$.pipe(
      select('parcellationSelected'),
      distinctUntilChanged(),
      map(parcellationSelected => {
        const returnArray = []
        const ngIdMap = getMultiNgIdsRegionsLabelIndexMap(parcellationSelected)
        for (const [ngId, labelIndexMap] of ngIdMap) {
          for (const [labelIndex, region] of labelIndexMap){
            returnArray.push({
              ...region,
              ngId,
              labelIndex,
              labelIndexId: generateLabelIndexId({ ngId, labelIndex })
            })
          }
        }
        return returnArray
      }),
      shareReplay(1)
    )

    this.autocompleteList$ = combineLatest(
      this.formControl.valueChanges.pipe(
        startWith(''),
        distinctUntilChanged(),
        debounceTime(200),
      ),
      this.regionsWithLabelIndex$.pipe(
        startWith([])
      )
    ).pipe(
      map(([searchTerm, regionsWithLabelIndex]) => regionsWithLabelIndex.filter(filterRegionBasedOnText(searchTerm))),
      map(arr => arr.slice(0, 5))
    )

    this.regionsSelected$ = viewerState$.pipe(
      select('regionsSelected'),
      distinctUntilChanged(),
      tap(regions => {
        const arrLabelIndexId = regions.map(({ ngId, labelIndex }) => generateLabelIndexId({ ngId, labelIndex }))
        this.selectedRegionLabelIndexSet = new Set(arrLabelIndexId)
      }),
      shareReplay(1)
    )

    this.parcellationSelected$ = viewerState$.pipe(
      select('parcellationSelected'),
      distinctUntilChanged(),
      shareReplay(1)
    )
  }

  public toggleRegionWithId(id: string, removeFlag=false){
    if (removeFlag) {
      this.store$.dispatch({
        type: VIEWER_STATE_ACTION_TYPES.DESELECT_REGIONS_WITH_ID,
        deselecRegionIds: [id]
      })
    } else {
      this.store$.dispatch({
        type: ADD_TO_REGIONS_SELECTION_WITH_IDS,
        selectRegionIds : [id]
      })
    }
  }

  public navigateTo(position){
    this.store$.dispatch({
      type: CHANGE_NAVIGATION,
      navigation: {
        position,
        animation: {}
      }
    })
  }

  public optionSelected(ev: MatAutocompleteSelectedEvent){
    const id = ev.option.value
    this.autoTrigger.nativeElement.value = ''
  }

  private regionsWithLabelIndex$: Observable<any[]>
  public autocompleteList$: Observable<any[]>
  public formControl = new FormControl()

  public regionsSelected$: Observable<any>
  public parcellationSelected$: Observable<any>


  @Output()
  public focusedStateChanged: EventEmitter<boolean> = new EventEmitter()

  private _focused: boolean = false
  set focused(val: boolean){
    this._focused = val
    this.focusedStateChanged.emit(val)
  }
  get focused(){
    return this._focused
  }

  public deselectAllRegions(event: MouseEvent){
    this.store$.dispatch({
      type: SELECT_REGIONS,
      selectRegions: []
    })
  }

  // TODO handle mobile
  handleRegionClick({ mode = null, region = null } = {}){
    const type = mode === 'single'
      ? VIEWERSTATE_CONTROLLER_ACTION_TYPES.SINGLE_CLICK_ON_REGIONHIERARCHY
      : mode === 'double'
        ? VIEWERSTATE_CONTROLLER_ACTION_TYPES.DOUBLE_CLICK_ON_REGIONHIERARCHY
        : ''
    this.store$.dispatch({
      type,
      payload: { region }
    })
  }

  showHierarchy(event:MouseEvent){
    // mat-card-content has a max height of 65vh
    const dialog = this.dialog.open(this.regionHierarchyDialogTemplate, {
      height: '65vh',
      panelClass: [
        'col-10',
        'col-sm-10',
        'col-md-8',
        'col-lg-8',
        'col-xl-6'
      ]
    })

    /**
     * keep sleight of hand shown while modal is shown
     * 
     */
    this.focused = true
    
    /**
     * take 1 to avoid memory leak
     */
    dialog.afterClosed().pipe(
      take(1)
    ).subscribe(() => this.focused = false)
  }

}