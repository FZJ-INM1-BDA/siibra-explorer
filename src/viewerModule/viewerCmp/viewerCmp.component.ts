import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentFactory, ComponentFactoryResolver, Inject, Injector, Input, OnDestroy, Optional, TemplateRef, ViewChild, ViewContainerRef } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, merge, NEVER, Observable, of, Subscription } from "rxjs";
import {catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap, mapTo } from "rxjs/operators";
import { viewerStateSetSelectedRegions } from "src/services/state/viewerState/actions";
import {
  viewerStateContextedSelectedRegionsSelector,
  viewerStateGetSelectedAtlas,
  viewerStateSelectedParcellationSelector,
  viewerStateSelectedTemplateSelector,
  viewerStateStandAloneVolumes,
  viewerStateViewerModeSelector
} from "src/services/state/viewerState/selectors"
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN, REGION_OF_INTEREST } from "src/util/interfaces";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { IQuickTourData } from "src/ui/quickTour";
import { PureContantService } from "src/util";
import { EnumViewerEvt, TContextArg, TSupportedViewers, TViewerEvent } from "../viewer.interface";
import { getGetRegionFromLabelIndexId, switchMapWaitFor } from "src/util/fn";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { ComponentStore } from "../componentStore";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { GenericInfoCmp } from "src/atlasComponents/regionalFeatures/bsFeatures/genericInfo";
import { _PLI_VOLUME_INJ_TOKEN, _TPLIVal } from "src/glue";
import { uiActionSetPreviewingDatasetFiles } from "src/services/state/uiState.store.helper";
import { viewerStateSetViewerMode } from "src/services/state/viewerState.store.helper";
import { DialogService } from "src/services/dialogService.service";
import { RouterService } from "src/routerModule/router.service";

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
    ComponentStore,
    DialogService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewerCmp implements OnDestroy {
  public _pliTitle = "Fiber structures of a human hippocampus based on joint DMRI, 3D-PLI, and TPFM acquisitions"
  public _pliDesc = "The collected datasets provide real multimodal, multiscale structural connectivity insights into the human hippocampus. One post mortem hippocampus was scanned with Anatomical and Diffusion MRI (dMRI) [1], 3D Polarized Light Imaging (3D-PLI) [2], and Two-Photon Fluorescence Microscopy (TPFM) [3] using protocols specifically developed during SGA1 and SGA2, rendering joint tissue imaging possible. MRI scanning was performed with a 11.7 T Preclinical MRI system (gradients: 760 mT/m, slew rate: 9500 T/m/s) yielding T1-w and T2-w maps at 200 µm and dMRI-based maps at 300 µm resolution. During tissue sectioning (60 µm thickness) blockface (en-face) images were acquired from the surface of the frozen brain block, serving as reference for data integration/co-alignment. 530 brain sections were scanned with 3D-PLI. HPC-based image analysis provided transmittance, retardation, and fiber orientation maps at 1.3 µm in-plane resolution. TPFM was finally applied to selected brain sections utilizing autofluorescence properties of the fibrous tissue which appears after PBS washing (MAGIC protocol). The TPFM measurements provide a resolution of 0.44 µm x 0.44 µm x 1 µm."
  public _pliLink = "https://doi.org/10.25493/JQ30-E08"
  
  public _1umTitle = `Cellular level 3D reconstructed volumes at 1µm resolution within the human occipital cortex (v1.0)`
  public _1umDesc = ``
  public _1umLink = `https://search.kg.ebrains.eu/instances/d71d369a-c401-4d7e-b97a-3fb78eed06c5`

  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS

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
    shareReplay(1),
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

  public viewerCtx$ = this.viewerModuleSvc.context$

  private _1umVoi$ = this.routerSvc.customRoute$.pipe(
    map(obj => obj[`x-voi`] === "d71d369a-c401-4d7e-b97a-3fb78eed06c5"),
    distinctUntilChanged()
  )

  public pliVol$ = merge(
    this._pliVol$?.pipe(
      mapTo({
        title: this._pliTitle,
        description: this._pliDesc,
        url: [{ doi: this._pliLink }]
      })
    ) || NEVER,
    this._1umVoi$.pipe(
      map(flag => flag
        ? ({
            title: this._1umTitle,
            description: this._1umDesc,
            url: [{ doi: this._1umLink }]
          })
        : null
      )
    )
  )

  /**
   * if no regions are selected, nor any additional layers (being deprecated)
   * then the "explore" btn should not show
   * and the full left side bar should not be expandable
   * if it is already expanded, it should collapse
   */
  public onlyShowMiniTray$: Observable<boolean> = combineLatest([
    this.selectedRegions$,
    this.pliVol$.pipe(
      startWith(null as { title: string, description: string, url: { doi: string }[] })
    ),
    this.viewerMode$.pipe(
      startWith(null as string)
    ),
  ]).pipe(
    map(([ regions, layers, viewerMode ]) => regions.length === 0 && !layers && !viewerMode)
  )

  @ViewChild('viewerStatusCtxMenu', { read: TemplateRef })
  private viewerStatusCtxMenu: TemplateRef<any>

  @ViewChild('viewerStatusRegionCtxMenu', { read: TemplateRef })
  private viewerStatusRegionCtxMenu: TemplateRef<any>

  public context: TContextArg<TSupportedViewers>
  private templateSelected: any
  private getRegionFromlabelIndexId: (arg: {labelIndexId: string}) => any

  private genericInfoCF: ComponentFactory<GenericInfoCmp>

  public clearVoi(){
    this.store$.dispatch(
      uiActionSetPreviewingDatasetFiles({
        previewingDatasetFiles: []
      })
    )
    this.routerSvc.setCustomRoute('x-voi', null)
  }
  constructor(
    private store$: Store<any>,
    private viewerModuleSvc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>,
    private cStore: ComponentStore<TCStoreViewerCmp>,
    cfr: ComponentFactoryResolver,
    private dialogSvc: DialogService,
    private cdr: ChangeDetectorRef,
    private routerSvc: RouterService,
    @Optional() @Inject(_PLI_VOLUME_INJ_TOKEN) private _pliVol$: Observable<_TPLIVal[]>,
    @Optional() @Inject(REGION_OF_INTEREST) public regionOfInterest$: Observable<any>
  ){

    this.genericInfoCF = cfr.resolveComponentFactory(GenericInfoCmp)

    this.subscriptions.push(
      this.selectedRegions$.subscribe(() => {
        this.clearPreviewingDataset()
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
      ),
      combineLatest([
        this.templateSelected$,
        this.parcellationSelected$,
        this.store$.pipe(
          select(viewerStateGetSelectedAtlas)
        )
      ]).pipe(
        debounceTime(160)
      ).subscribe(async ([tmpl, parc, atlas]) => {
        const regex = /pre.?release/i
        const checkPrerelease = (obj: any) => {
          if (obj?.name) return regex.test(obj.name)
          return false
        }
        const message: string[] = []
        if (checkPrerelease(atlas)) {
          message.push(`- _${atlas.name}_`)
        }
        if (checkPrerelease(tmpl)) {
          message.push(`- _${tmpl.name}_`)
        }
        if (checkPrerelease(parc)) {
          message.push(`- _${parc.name}_`)
        }
        if (message.length > 0) {
          message.unshift(`The following have been tagged pre-release, and may be updated frequently:`)
          try {
            await this.dialogSvc.getUserConfirm({
              title: `Pre-release warning`,
              markdown: message.join('\n\n'),
              confirmOnly: true
            })
          // eslint-disable-next-line no-empty
          } catch (e) {

          }
        }
      })
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
        this.cdr.markForCheck()
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

  public exitSpecialViewMode(){
    this.store$.dispatch(
      viewerStateSetViewerMode({
        payload: null
      })
    )
  }

  public clearPreviewingDataset(){
    /**
     * clear all preview
     */
    this.cStore.setState({
      overlaySideNav: null
    })
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
