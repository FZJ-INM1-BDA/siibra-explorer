import { Component, ComponentFactory, ComponentFactoryResolver, ElementRef, Inject, Injector, Input, OnDestroy, Optional, TemplateRef, ViewChild, ViewContainerRef } from "@angular/core";
import { select, Store } from "@ngrx/store";
import {combineLatest, merge, Observable, of, Subject, Subscription} from "rxjs";
import {catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap } from "rxjs/operators";
import { viewerStateSetSelectedRegions } from "src/services/state/viewerState/actions";
import {
  viewerStateContextedSelectedRegionsSelector,
  viewerStateSelectedParcellationSelector,
  viewerStateSelectedTemplateSelector,
  viewerStateStandAloneVolumes,
  viewerStateViewerModeSelector
} from "src/services/state/viewerState/selectors"
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN, REGION_OF_INTEREST } from "src/util/interfaces";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { SwitchDirective } from "src/util/directives/switch.directive";
import { QuickTourThis, IQuickTourData } from "src/ui/quickTour";
import { MatDrawer } from "@angular/material/sidenav";
import { PureContantService } from "src/util";
import { EnumViewerEvt, TContextArg, TSupportedViewers, TViewerEvent } from "../viewer.interface";
import { getGetRegionFromLabelIndexId, switchMapWaitFor } from "src/util/fn";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { ComponentStore } from "../componentStore";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { GenericInfoCmp } from "src/atlasComponents/regionalFeatures/bsFeatures/genericInfo";

type TCStoreViewerCmp = {
  overlaySideNav: any
}

export function ROIFactory(store: Store<any>, svc: PureContantService){
  return store.pipe(
    select(viewerStateContextedSelectedRegionsSelector),
    switchMap(r => {
      if (!r[0]) return of(null)
      const { context } = r[0]
      const { atlas, template, parcellation } = context || {}
      return merge(
        of(null),
        svc.getRegionDetail(atlas['@id'], parcellation['@id'], template['@id'], r[0]).pipe(
          map(det => {
            return {
              ...r[0],
              ...det,
            }
          }),
          // in case detailed requests fails
          catchError((_err, _obs) => of(r[0])),
        )
      )
    }),
    shareReplay(1)
  )
}

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
      useFactory: ROIFactory,
      deps: [ Store, PureContantService ]
    },
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useFactory: (cStore: ComponentStore<TCStoreViewerCmp>) => {
        return function overwriteShowDatasetDialog( arg: any ){
          
          cStore.setState({
            overlaySideNav: arg
          })
        }
      },
      deps: [ ComponentStore ]
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

  @ViewChild('genericInfoVCR', { read: ViewContainerRef })
  genericInfoVCR: ViewContainerRef

  public quickTourRegionSearch: IQuickTourData = {
    order: 7,
    description: QUICKTOUR_DESC.REGION_SEARCH,
  }
  public quickTourAtlasSelector: IQuickTourData = {
    order: 0,
    description: QUICKTOUR_DESC.ATLAS_SELECTOR,
  }

  @Input() ismobile = false

  private subscriptions: Subscription[] = []
  private onDestroyCb: (() => void)[]  = []
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

  public viewerMode$: Observable<string> = this.store$.pipe(
    select(viewerStateViewerModeSelector),
  )

  public overlaySidenav$ = this.cStore.select(s => s.overlaySideNav).pipe(
    shareReplay(1),
  )

  public useViewer$: Observable<TSupportedViewers | 'notsupported'> = combineLatest([
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

  @ViewChild('viewerStatusCtxMenu', { read: TemplateRef })
  private viewerStatusCtxMenu: TemplateRef<any>

  @ViewChild('viewerStatusRegionCtxMenu', { read: TemplateRef })
  private viewerStatusRegionCtxMenu: TemplateRef<any>

  public context: TContextArg<TSupportedViewers>
  private templateSelected: any
  private getRegionFromlabelIndexId: (arg: {labelIndexId: string}) => any

  private genericInfoCF: ComponentFactory<GenericInfoCmp>
  constructor(
    private store$: Store<any>,
    private viewerModuleSvc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>,
    private cStore: ComponentStore<TCStoreViewerCmp>,
    cfr: ComponentFactoryResolver,
    @Optional() @Inject(REGION_OF_INTEREST) public regionOfInterest$: Observable<any>
  ){

    this.genericInfoCF = cfr.resolveComponentFactory(GenericInfoCmp)

    this.subscriptions.push(
      this.selectedRegions$.subscribe(() => {
        this.clearPreviewingDataset()
      }),
      this.alwaysHideMinorPanel$.pipe(
        distinctUntilChanged(),
        filter(flag => !flag),
      ).subscribe(() => {
        this.openSideNavs()
      }),
      this.viewerModuleSvc.context$.subscribe(
        (ctx: any) => this.context = ctx
      ),
      this.templateSelected$.subscribe(
        t => this.templateSelected = t
      ),
      this.parcellationSelected$.subscribe(
        p => {
          this.getRegionFromlabelIndexId = !!p
            ? getGetRegionFromLabelIndexId({ parcellation: p })
            : null
        }
      )
    )
  }

  ngAfterViewInit(){
    const cb: TContextMenuReg<TContextArg<'nehuba' | 'threeSurfer'>> = ({ append, context }) => {

      /**
       * first append general viewer info
       */
      append({
        tmpl: this.viewerStatusCtxMenu,
        data: {
          context,
          metadata: {
            template: this.templateSelected,
          }
        },
        order: 0
      })

      /**
       * check hovered region
       */
      let hoveredRegions = []
      if (context.viewerType === 'nehuba') {
        hoveredRegions = (context as TContextArg<'nehuba'>).payload.nehuba.reduce(
          (acc, curr) => acc.concat(
            curr.labelIndices.map(
              lblIdx => {
                const labelIndexId = `${curr.layerName}#${lblIdx}`
                if (!!this.getRegionFromlabelIndexId) {
                  return this.getRegionFromlabelIndexId({
                    labelIndexId: `${curr.layerName}#${lblIdx}`
                  })
                }
                return labelIndexId
              }
            )
          ),
          []
        )
      }

      if (context.viewerType === 'threeSurfer') {
        hoveredRegions = (context as TContextArg<'threeSurfer'>).payload._mouseoverRegion
      }

      if (hoveredRegions.length > 0) {
        append({
          tmpl: this.viewerStatusRegionCtxMenu,
          data: {
            context,
            metadata: { hoveredRegions }
          },
          order: 5
        })
      }

      return true
    }
    this.viewerModuleSvc.register(cb)
    this.onDestroyCb.push(
      () => this.viewerModuleSvc.deregister(cb)
    )
    this.subscriptions.push(
      this.overlaySidenav$.pipe(
        switchMap(switchMapWaitFor({
          condition: () => !!this.genericInfoVCR
        }))
      ).subscribe(data => {
        if (!this.genericInfoVCR) {
          console.warn(`genericInfoVCR not defined!`)
          return
        }
        const injector = Injector.create({
          providers: [{
            provide: MAT_DIALOG_DATA,
            useValue: data
          }]
        })

        this.genericInfoVCR.clear()
        this.genericInfoVCR.createComponent(this.genericInfoCF, null, injector)

      })
    )
  }

  ngOnDestroy() {
    while (this.subscriptions.length) this.subscriptions.pop().unsubscribe()
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  public selectRoi(roi: any) {
    this.store$.dispatch(
      viewerStateSetSelectedRegions({
        selectRegions: [ roi ]
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

  public clearPreviewingDataset(){
    /**
     * clear all preview
     */
    this.cStore.setState({
      overlaySideNav: null
    })
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

  public handleViewerEvent(event: TViewerEvent<'nehuba' | 'threeSurfer'>){
    switch(event.type) {
    case EnumViewerEvt.VIEWERLOADED:
      this.viewerLoaded = event.data
      break
    case EnumViewerEvt.VIEWER_CTX:
      this.viewerModuleSvc.context$.next(event.data)
      break
    default:
    }
  }

  public disposeCtxMenu(){
    this.viewerModuleSvc.dismissCtxMenu()
  }
}
