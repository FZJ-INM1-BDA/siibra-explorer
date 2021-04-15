import { Component, ElementRef, Inject, Input, OnDestroy, Optional, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subject, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map, startWith } from "rxjs/operators";
import { viewerStateHelperSelectParcellationWithId, viewerStateRemoveAdditionalLayer, viewerStateSetSelectedRegions } from "src/services/state/viewerState/actions";
import { viewerStateContextedSelectedRegionsSelector, viewerStateGetOverlayingAdditionalParcellations, viewerStateParcVersionSelector, viewerStateSelectedParcellationSelector,  viewerStateSelectedTemplateSelector, viewerStateStandAloneVolumes } from "src/services/state/viewerState/selectors"
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { ngViewerActionClearView } from "src/services/state/ngViewerState/actions";
import { ngViewerSelectorClearViewEntries } from "src/services/state/ngViewerState/selectors";
import { uiActionHideAllDatasets, uiActionHideDatasetWithId } from "src/services/state/uiState/actions";
import { REGION_OF_INTEREST } from "src/util/interfaces";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SwitchDirective } from "src/util/directives/switch.directive";
import { IViewerCmpUiState, TSupportedViewer } from "../constants";
import { QuickTourThis, IQuickTourData } from "src/ui/quickTour";
import { MatDrawer } from "@angular/material/sidenav";
import { ComponentStore } from "../componentStore";

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
        map(rs => {
          if (!rs[0]) return null
          return rs[0]
        })
      ),
      deps: [
        Store
      ]
    },
    ComponentStore
  ]
})

export class ViewerCmp implements OnDestroy {

  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS

  @ViewChild('sideNavTopSwitch', { static: true })
  private sidenavTopSwitch: SwitchDirective

  @ViewChild('sideNavFullLeftSwitch', { static: true })
  private sidenavLeftSwitch: SwitchDirective

  
  public quickTourRegionSearch: IQuickTourData = {
    order: 7,
    description: QUICKTOUR_DESC.REGION_SEARCH,
  }
  public quickTourAtlasSelector: IQuickTourData = {
    order: 0,
    description: QUICKTOUR_DESC.ATLAS_SELECTOR,
  }
  public quickTourChips: IQuickTourData = {
    order: 5,
    description: QUICKTOUR_DESC.CHIPS,
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
    private viewerCmpLocalUiStore: ComponentStore<IViewerCmpUiState>,
    @Optional() @Inject(REGION_OF_INTEREST) public regionOfInterest$: Observable<any>
  ){
    this.viewerCmpLocalUiStore.setState({
      sideNav: {
        activePanelsTitle: []
      }
    })

    this.activePanelTitles$ = this.viewerCmpLocalUiStore.select(
      state => state.sideNav.activePanelsTitle
    ) as Observable<string[]>
    this.subscriptions.push(
      this.activePanelTitles$.subscribe(
        (activePanelTitles: string[]) => this.activePanelTitles = activePanelTitles
      )
    )

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

  public activePanelTitles$: Observable<string[]>
  private activePanelTitles: string[] = []
  handleExpansionPanelClosedEv(title: string){
    this.viewerCmpLocalUiStore.setState({
      sideNav: {
        activePanelsTitle: this.activePanelTitles.filter(n => n !== title)
      }
    })
  }
  handleExpansionPanelAfterExpandEv(title: string){
    if (this.activePanelTitles.includes(title)) return
    this.viewerCmpLocalUiStore.setState({
      sideNav: {
        activePanelsTitle: [
          ...this.activePanelTitles,
          title
        ]
      }
    })
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

  @ViewChild('regionSelRef', { read: ElementRef })
  regionSelRef: ElementRef<any>

  @ViewChild('regionSearchQuickTour', { read: QuickTourThis })
  regionSearchQuickTour: QuickTourThis

  @ViewChild('matDrawerLeft', { read: MatDrawer })
  matDrawerLeft: MatDrawer

  handleSideNavAnimationDone(sideNavExpanded: boolean) {
    this.regionSearchQuickTour?.attachTo(
      !sideNavExpanded ? null : this.regionSelRef
    )
  }
}
