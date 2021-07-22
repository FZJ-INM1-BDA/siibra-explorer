import { Component, ElementRef, Inject, Input, OnDestroy, Optional, TemplateRef, ViewChild } from "@angular/core";
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
import { getGetRegionFromLabelIndexId } from "src/util/fn";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { ComponentStore } from "../componentStore";

interface IOverlayTypes {
  ebrainsRegionalDataset: {
    datasetId: string
    atlasId: string
    parcId: string
    region: any
    spaceId?: string
  }
}

type TOverlaySideNav<T extends keyof IOverlayTypes> = {
  '@type': T
  context: IOverlayTypes[T]
}

type TCStoreViewerCmp = {
  overlaySideNav: TOverlaySideNav<keyof IOverlayTypes>
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
      useFactory: (store: Store<any>, svc: PureContantService) => store.pipe(
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
                  ...det,
                  context
                }
              }),
              // in case detailed requests 
              catchError((_err, _obs) => of(r[0])),
            )
          )
        }),
        shareReplay(1)
      ),
      deps: [ Store, PureContantService ]
    },
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useFactory: (cStore: ComponentStore<TCStoreViewerCmp>) => {
        return function overwriteShowDatasetDialog( arg: { fullId?: string, name: string, description: string }, data: any ){
          
          const { region } = data
          const datasetId = arg.fullId
          const atlasId = data?.region?.context?.atlas?.['@id']
          const parcId = data?.region?.context?.parcellation?.['@id']
          const spaceId = data?.region?.context?.template?.['@id']
          cStore.setState({
            overlaySideNav: {
              '@type': 'ebrainsRegionalDataset',
              context: {
                datasetId,
                atlasId,
                parcId,
                region,
                spaceId,
              }
            }
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

  public overlaySidenav$ = this.cStore.select(s => s.overlaySideNav)

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
  private getRegionFromlabelIndexId: Function

  constructor(
    private store$: Store<any>,
    private viewerModuleSvc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>,
    private cStore: ComponentStore<TCStoreViewerCmp>,
    @Optional() @Inject(REGION_OF_INTEREST) public regionOfInterest$: Observable<any>
  ){

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
