import {AfterViewInit, Component, Inject, Input, OnDestroy, Optional, ViewChild} from "@angular/core";
import { select, Store } from "@ngrx/store";
import {BehaviorSubject, combineLatest, Observable, of, Subject, Subscription} from "rxjs";
import { distinctUntilChanged, filter, map, startWith } from "rxjs/operators";
import { viewerStateHelperSelectParcellationWithId, viewerStateRemoveAdditionalLayer, viewerStateSetSelectedRegions } from "src/services/state/viewerState/actions";
import { viewerStateContextedSelectedRegionsSelector, viewerStateGetOverlayingAdditionalParcellations, viewerStateParcVersionSelector, viewerStateSelectedParcellationSelector,  viewerStateSelectedTemplateSelector, viewerStateStandAloneVolumes } from "src/services/state/viewerState/selectors"
import { CONST, ARIA_LABELS } from 'common/constants'
import { ngViewerActionClearView } from "src/services/state/ngViewerState/actions";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState/selectors";
import { uiActionHideAllDatasets, uiActionHideDatasetWithId } from "src/services/state/uiState/actions";
import { REGION_OF_INTEREST } from "src/util/interfaces";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SwitchDirective } from "src/util/directives/switch.directive";
import { TSupportedViewer } from "../constants";

@Component({
  selector: 'iav-cmp-viewer-container',
  templateUrl: './viewerCmp.template.html',
  styleUrls: [
    './viewerCmp.style.css'
  ],
  exportAs: 'iavCmpViewerCntr',
  animations: [
    trigger('openClose', [
      state('open', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      state('closed', style({
        transform: 'translateY(-100vh)',
        opacity: 0
      })),
      transition('open => closed', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('closed => open', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ]),
    trigger('openCloseAnchor', [
      state('open', style({
        transform: 'translateY(0)'
      })),
      state('closed', style({
        transform: 'translateY(100vh)'
      })),
      transition('open => closed', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('closed => open', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ]),
  ],
  providers: [
    {
      provide: REGION_OF_INTEREST,
      useFactory: (store: Store<any>) => store.pipe(
        select(viewerStateContextedSelectedRegionsSelector),
        map(rs => rs[0] || null)
      ),
      deps: [
        Store
      ]
    }
  ]
})

export class ViewerCmp implements OnDestroy {

  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS

  @ViewChild('sideNavTopSwitch', { static: true })
  private sidenavTopSwitch: SwitchDirective

  @ViewChild('sideNavFullLeftSwitch', { static: true })
  private sidenavLeftSwitch: SwitchDirective

  public sidebarQuickTourPosition$: BehaviorSubject<any> = new BehaviorSubject({arrow: 'arrow5', left: 30, top: 50, arrowPosition: 'top-right', arrowTransform: 'rotate(25deg)'})
  quickTourRegionSearch = {
    order: 7,
    description: 'Use the region quick search for finding, selecting and navigating brain regions in the selected parcellation map.',
    overwritePos: this.sidebarQuickTourPosition$
  }
  quickTourAtlasSelector = {
    order: 0,
    description: 'This is the atlas selector. Click here to choose between EBRAINS reference atlases of different species.',
    position: 'bottom',
    align: 'right',
    overwritePos: of({arrowPosition: 'top', arrowAlign: 'center'})
  }
  quickTourChips = {
    order: 5,
    description: 'These „chips“ indicate the currently selected parcellation map as well as selected region. Click the chip to see different versions, if any. Click (i) to read more about a selected item. Click (x) to clear a selection.',
    position: 'top',
    align: 'center',
    overwritePos: of({arrowPosition: 'bottom', arrowAlign: 'center', arrowTransform: 'scaleX(-1) rotate(180deg)', recalculate: true})
  }


  @Input() ismobile = false

  private subscriptions: Subscription[] = []
  public viewerLoaded: boolean = false

  public templateSelected$ = this.store$.pipe(
    select(viewerStateSelectedTemplateSelector),
    distinctUntilChanged(),
  )
  public parcellationSelected$ = this.store$.pipe(
    select(viewerStateSelectedParcellationSelector),
    distinctUntilChanged(),
  )

  public selectedRegions$ = this.store$.pipe(
    select(viewerStateContextedSelectedRegionsSelector),
    distinctUntilChanged(),
  )

  public isStandaloneVolumes$ = this.store$.pipe(
    select(viewerStateStandAloneVolumes),
    map(v => v.length > 0)
  )

  public useViewer$: Observable<TSupportedViewer> = combineLatest([
    this.templateSelected$,
    this.isStandaloneVolumes$,
  ]).pipe(
    map(([t, isSv]) => {
      if (isSv) return 'nehuba'
      if (!t) return null
      if (!!t['nehubaConfigURL'] || !!t['nehubaConfig']) return 'nehuba'
      if (!!t['three-surfer']) return 'threeSurfer'
      return 'notsupported'
    })
  )

  public selectedLayerVersions$ = this.store$.pipe(
    select(viewerStateParcVersionSelector),
    map(arr => arr.map(item => {
      const overwrittenName = item['@version'] && item['@version']['name']
      return overwrittenName
        ? { ...item, displayName: overwrittenName }
        : item
    }))
  )

  public selectedAdditionalLayers$ = this.store$.pipe(
    select(viewerStateGetOverlayingAdditionalParcellations),
  )

  public clearViewKeys$ = this.store$.pipe(
    select(ngViewerSelectorClearViewEntries)
  )

  /**
   * TODO may need to be deprecated
   * in favour of regional feature/data feature
   */
  public iavAdditionalLayers$ = new Subject<any[]>()

  /**
   * if no regions are selected, nor any additional layers (being deprecated)
   * then the "explore" btn should not show
   * and the full left side bar should not be expandable
   * if it is already expanded, it should collapse
   */
  public alwaysHideMinorPanel$: Observable<boolean> = combineLatest([
    this.selectedRegions$,
    this.iavAdditionalLayers$.pipe(
      startWith([])
    )
  ]).pipe(
    map(([ regions, layers ]) => regions.length === 0 && layers.length === 0)
  )

  constructor(
    private store$: Store<any>,
    @Optional() @Inject(REGION_OF_INTEREST) public regionOfInterest$: Observable<any>
  ){
    this.subscriptions.push(
      this.alwaysHideMinorPanel$.pipe(
        distinctUntilChanged(),
        filter(flag => !flag),
      ).subscribe(() => {
        this.openSideNavs()
      })
    )
  }

  ngOnDestroy() {
    while (this.subscriptions.length) this.subscriptions.pop().unsubscribe()
  }


  public bindFns(fns){
    return () => {
      for (const [ fn, ...arg] of fns) {
        fn(...arg)
      }
    }
  }

  public clearAdditionalLayer(layer: { ['@id']: string }){
    this.store$.dispatch(
      viewerStateRemoveAdditionalLayer({
        payload: layer
      })
    )
  }

  public clearSelectedRegions(){
    this.store$.dispatch(
      viewerStateSetSelectedRegions({
        selectRegions: []
      })
    )
  }

  public selectParcellation(parc: any) {
    this.store$.dispatch(
      viewerStateHelperSelectParcellationWithId({
        payload: parc
      })
    )
  }

  public handleChipClick(){
    this.openSideNavs()
  }

  private openSideNavs() {
    this.sidebarQuickTourPosition$.next({left: 30, top: 70, arrowPosition: 'top', arrowAlign: 'center', recalculate: true})
    this.sidenavLeftSwitch && this.sidenavLeftSwitch.open()
    this.sidenavTopSwitch && this.sidenavTopSwitch.open()
  }

  public unsetClearViewByKey(key: string){
    this.store$.dispatch(
      ngViewerActionClearView({ payload: {
        [key]: false
      }})
    )
  }
  public clearPreviewingDataset(id: string){
    /**
     * clear all preview
     */
    this.store$.dispatch(
      id
        ? uiActionHideDatasetWithId({ id })
        : uiActionHideAllDatasets()
    )
  }
}
