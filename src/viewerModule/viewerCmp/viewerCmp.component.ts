import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, TemplateRef, ViewChild, ViewContainerRef } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, of, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap } from "rxjs/operators";
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { animate, state, style, transition, trigger } from "@angular/animations";
import { IQuickTourData } from "src/ui/quickTour";
import { EnumViewerEvt, TContextArg, TSupportedViewers, TViewerEvent } from "../viewer.interface";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { DialogService } from "src/services/dialogService.service";
import { SAPI, SapiRegionModel } from "src/atlasComponents/sapi";
import { atlasSelection, userInteraction, } from "src/state";
import { SapiSpatialFeatureModel, SapiFeatureModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi/type";
import { getUuid } from "src/util/fn";

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
    DialogService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewerCmp implements OnDestroy {

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

  private subscriptions: Subscription[] = []
  private onDestroyCb: (() => void)[]  = []
  public viewerLoaded: boolean = false

  private selectedATP = this.store$.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    shareReplay(1)
  )

  public selectedAtlas$ = this.selectedATP.pipe(
    map(({ atlas }) => atlas)
  )
  public templateSelected$ = this.selectedATP.pipe(
    map(({ template }) => template)
  )
  public parcellationSelected$ = this.selectedATP.pipe(
    map(({ parcellation }) => parcellation)
  )

  public allAvailableParcellations$ = this.store$.pipe(
    atlasSelection.fromRootStore.allAvailParcs(this.sapi)
  )

  public selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions),
  )

  public allAvailableRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedParcAllRegions)
  )

  public isStandaloneVolumes$ = this.store$.pipe(
    select(atlasSelection.selectors.standaloneVolumes),
    map(v => v.length > 0)
  )

  public viewerMode$: Observable<string> = this.store$.pipe(
    select(atlasSelection.selectors.viewerMode),
    shareReplay(1),
  )

  public useViewer$: Observable<TSupportedViewers | 'notsupported'> = combineLatest([
    this.store$.pipe(
      atlasSelection.fromRootStore.distinctATP(),
      switchMap(({ atlas, template }) => atlas && template
        ? this.sapi.getSpace(atlas["@id"], template["@id"]).getVolumes()
        : of(null)),
      map(vols => {
        if (!vols) return null
        const flags = {
          isNehuba: false,
          isThreeSurfer: false
        }
        if (vols.find(vol => vol.data.volume_type === "neuroglancer/precomputed")) {
          flags.isNehuba = true
        }

        if (vols.find(vol => vol.data.volume_type === "gii")) {
          flags.isThreeSurfer = true
        }
        return flags
      })
    ),
    this.isStandaloneVolumes$,
  ]).pipe(
    distinctUntilChanged(([ prevFlags, prevIsSv ], [  currFlags, currIsSv ]) => {
      const same = prevIsSv === currIsSv
      && prevFlags?.isNehuba === currFlags?.isNehuba
      && prevFlags?.isThreeSurfer === currFlags?.isThreeSurfer
      return same
    }),
    map<unknown, TSupportedViewers | 'notsupported'>(([flags, isSv]) => {
      if (isSv) return 'nehuba'
      if (!flags) return null
      if (flags.isNehuba) return 'nehuba'
      if (flags.isThreeSurfer) return 'threeSurfer'
      return 'notsupported'
    }),
    shareReplay(1),
  )

  public viewerCtx$ = this.ctxMenuSvc.context$

  public selectedFeature$: Observable<SapiFeatureModel> = this.store$.pipe(
    select(userInteraction.selectors.selectedFeature)
  )

  /**
   * if no regions are selected, nor any additional layers (being deprecated)
   * then the "explore" btn should not show
   * and the full left side bar should not be expandable
   * if it is already expanded, it should collapse
   */
  public onlyShowMiniTray$: Observable<boolean> = combineLatest([
    this.selectedRegions$,
    this.viewerMode$.pipe(
      startWith(null as string)
    ),
    this.selectedFeature$,
  ]).pipe(
    map(([ regions, viewerMode, selectedFeature ]) => regions.length === 0 && !viewerMode && !selectedFeature)
  )

  @ViewChild('viewerStatusCtxMenu', { read: TemplateRef })
  private viewerStatusCtxMenu: TemplateRef<any>

  @ViewChild('viewerStatusRegionCtxMenu', { read: TemplateRef })
  private viewerStatusRegionCtxMenu: TemplateRef<any>

  public context: TContextArg<TSupportedViewers>
  private templateSelected: SapiSpaceModel

  constructor(
    private store$: Store<any>,
    private ctxMenuSvc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>,
    private dialogSvc: DialogService,
    private cdr: ChangeDetectorRef,
    private sapi: SAPI,
  ){

    this.subscriptions.push(
      this.ctxMenuSvc.context$.subscribe(
        (ctx: any) => this.context = ctx
      ),
      this.templateSelected$.subscribe(
        t => this.templateSelected = t
      ),
      combineLatest([
        this.templateSelected$,
        this.parcellationSelected$,
        this.selectedAtlas$,
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
          message.push(`- _${tmpl.fullName}_`)
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

  ngAfterViewInit(): void{
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
          (acc, curr) => acc.concat(...curr.regions),
          []
        )
      }

      if (context.viewerType === 'threeSurfer') {
        hoveredRegions = (context as TContextArg<'threeSurfer'>).payload.regions
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
    this.ctxMenuSvc.register(cb)
    this.onDestroyCb.push(
      () => this.ctxMenuSvc.deregister(cb)
    )
  }

  ngOnDestroy(): void {
    while (this.subscriptions.length) this.subscriptions.pop().unsubscribe()
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }

  public clearRoi(): void{
    this.store$.dispatch(
      atlasSelection.actions.clearSelectedRegions()
    )
  }

  public selectRoi(roi: SapiRegionModel): void {
    this.store$.dispatch(
      atlasSelection.actions.selectRegion({
        region: roi
      })
    )
  }

  public exitSpecialViewMode(): void{
    this.store$.dispatch(
      atlasSelection.actions.clearViewerMode()
    )
  }

  public handleViewerEvent(event: TViewerEvent<'nehuba' | 'threeSurfer'>): void{
    switch(event.type) {
    case EnumViewerEvt.VIEWERLOADED:
      this.viewerLoaded = event.data
      this.cdr.detectChanges()
      break
    case EnumViewerEvt.VIEWER_CTX:
      this.ctxMenuSvc.context$.next(event.data)
      if (event.data.viewerType === "nehuba") {
        const { nehuba, nav } = (event.data as TContextArg<"nehuba">).payload
        if (nehuba) {
          const mousingOverRegions = (nehuba || []).reduce((acc, { regions }) => acc.concat(...regions), [])
          this.store$.dispatch(
            userInteraction.actions.mouseoverRegions({
              regions: mousingOverRegions
            })
          )
        }
        if (nav) {
          this.store$.dispatch(
            userInteraction.actions.mouseoverPosition({
              position: {
                "@id": getUuid(),
                "@type": "https://openminds.ebrains.eu/sands/CoordinatePoint",
                coordinates: nav.position.map(p => {
                  return {
                    value: p,
                  }
                }),
                coordinateSpace: {
                  '@id': this.templateSelected["@id"]
                }
              }
            })
          )
        }
      }
      break
    default:
    }
  }

  public disposeCtxMenu(): void{
    this.ctxMenuSvc.dismissCtxMenu()
  }

  showDataset(feat: SapiFeatureModel): void {
    if ((feat as SapiSpatialFeatureModel).location) {
      const feature = feat as SapiSpatialFeatureModel
      this.store$.dispatch(
        atlasSelection.actions.navigateTo({
          navigation: {
            orientation: [0, 0, 0, 1],
            position: feature.location.center.coordinates.map(v => v.value * 1e6)
          },
          animation: true
        })
      )
    }
    
    this.store$.dispatch(
      userInteraction.actions.showFeature({
        feature: feat
      })
    )
  }

  clearSelectedFeature(): void{
    this.store$.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

  onDismissNonbaseLayer(): void{
    this.store$.dispatch(
      atlasSelection.actions.clearNonBaseParcLayer()
    )
  }
  onSelectParcellation(parcellation: SapiParcellationModel): void{
    this.store$.dispatch(
      atlasSelection.actions.selectParcellation({
        parcellation
      })
    )
  }
  navigateTo(position: number[]): void {
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position
        },
        animation: true,
      })
    )
  }
}
