import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { combineLatest, Observable, Subscription } from "rxjs";
import { debounceTime, map, shareReplay } from "rxjs/operators";
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { animate, state, style, transition, trigger } from "@angular/animations";
import { IQuickTourData } from "src/ui/quickTour";
import { EnumViewerEvt, TContextArg, TSupportedViewers, TViewerEvent } from "../viewer.interface";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { DialogService } from "src/services/dialogService.service";
import { SAPI } from "src/atlasComponents/sapi";
import { Feature, SxplrAtlas, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { EntryComponent } from "src/features/entry/entry.component";
import { TFace, TSandsPoint, getCoord } from "src/util/types";
import { wait } from "src/util/fn";

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

  @ViewChild('voiFeatureEntryCmp', { read: EntryComponent })
  voiCmp: EntryComponent

  public CONST = CONST
  public ARIA_LABELS = ARIA_LABELS
  
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

  public fetchedAtlases$: Observable<SxplrAtlas[]> = this.sapi.atlases$

  public selectedAtlas$ = this.selectedATP.pipe(
    map(({ atlas }) => atlas)
  )
  public templateSelected$ = this.selectedATP.pipe(
    map(({ template }) => template)
  )
  
  #templateSelected$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedTemplate)
  )

  public parcellationSelected$ = this.selectedATP.pipe(
    map(({ parcellation }) => parcellation)
  )
  #parcellationSelected$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedParcellation)
  )

  #selectedRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedRegions),
  )

  public allAvailableRegions$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedParcAllRegions)
  )

  #viewerMode$: Observable<string> = this.store$.pipe(
    select(atlasSelection.selectors.viewerMode),
  )

  public useViewer$: Observable<TSupportedViewers | 'notsupported'> = this.store$.pipe(
    select(atlasAppearance.selectors.useViewer),
    map(useviewer => {
      if (useviewer === "NEHUBA") return "nehuba"
      if (useviewer === "THREESURFER") return "threeSurfer"
      if (useviewer === "NOT_SUPPORTED") return "notsupported"
      return null
    })
  )

  public viewerCtx$ = this.ctxMenuSvc.context$

  #selectedFeature$: Observable<Feature> = this.store$.pipe(
    select(userInteraction.selectors.selectedFeature)
  )

  #selectedPoint$ = this.store$.pipe(
    select(atlasSelection.selectors.relevantSelectedPoint)
  )

  public view$ = combineLatest([
    this.#selectedRegions$,
    this.#viewerMode$,
    this.#selectedFeature$,
    this.#selectedPoint$,
    this.#templateSelected$,
    this.#parcellationSelected$
  ]).pipe(
    map(([ selectedRegions, viewerMode, selectedFeature, selectedPoint, selectedTemplate, selectedParcellation ]) => {
      let spatialObjectTitle: string
      let spatialObjectSubtitle: string
      if (selectedPoint) {
        const { ['@type']: selectedPtType } = selectedPoint
        if (selectedPtType === "https://openminds.ebrains.eu/sands/CoordinatePoint") {
          spatialObjectTitle = `Point: ${selectedPoint.coordinates.map(v => (v.value / 1e6).toFixed(2))} (mm)`
        }
        if (selectedPtType === "siibra-explorer/surface/face") {
          spatialObjectTitle = `Face: #${selectedPoint.face}`
        }
      }
      if (!!selectedTemplate) {
        spatialObjectSubtitle = selectedTemplate.name
      }
      return {
        viewerMode,
        selectedRegions,
        selectedFeature,
        selectedPoint,
        selectedTemplate,
        selectedParcellation,

        /**
         * Selected Spatial Object
         */
        spatialObjectTitle,
        spatialObjectSubtitle,

        /**
         * if no regions are selected, nor any additional layers (being deprecated)
         * then the "explore" btn should not show
         * and the full left side bar should not be expandable
         * if it is already expanded, it should collapse
         */
        onlyShowMiniTray: selectedRegions.length === 0 && !viewerMode && !selectedFeature && !selectedPoint
      }
    }),
    shareReplay(1),
  )

  @ViewChild('viewerStatusCtxMenu', { read: TemplateRef })
  private viewerStatusCtxMenu: TemplateRef<any>

  @ViewChild('viewerStatusRegionCtxMenu', { read: TemplateRef })
  private viewerStatusRegionCtxMenu: TemplateRef<any>

  private templateSelected: SxplrTemplate

  constructor(
    private store$: Store<any>,
    private ctxMenuSvc: ContextMenuService<TContextArg<'threeSurfer' | 'nehuba'>>,
    private dialogSvc: DialogService,
    private cdr: ChangeDetectorRef,
    private sapi: SAPI,
  ){

    this.subscriptions.push(
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

      if (!context) {
        return true
      }

      /**
       * check hovered region
       */
      let hoveredRegions = []
      if (context.viewerType === 'nehuba') {
        hoveredRegions = ((context as TContextArg<'nehuba'>).payload.nehuba || []).reduce(
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

  public selectRoi(roi: SxplrRegion): void {
    this.store$.dispatch(
      atlasSelection.actions.selectRegion({
        region: roi
      })
    )
  }

  public toggleRoi(roi: SxplrRegion) {
    this.store$.dispatch(
      atlasSelection.actions.toggleRegion({
        region: roi
      })
    )
  }

  public selectPoint(pointSpec: {point?: number[], face?: number, vertices?: number[]}, template: SxplrTemplate){
    const { point, face, vertices } = pointSpec
    const id = `${template.id}-${point ? point.join(',') : face}`
    let pointOfInterest: TFace | TSandsPoint

    if (point) {
      pointOfInterest = {
        "@id": `${template.id}-${point.join(',')}`,
        "@type": "https://openminds.ebrains.eu/sands/CoordinatePoint" as const,
        coordinateSpace: {
          "@id": template.id
        },
        coordinates: point.map(v => getCoord(v))
      }
    }
    if ((face === 0 || !!face) && vertices) {
      pointOfInterest = {
        "@id": id,
        "@type": "siibra-explorer/surface/face" as const,
        coordinateSpace: {
          "@id": template.id
        },
        face,
        vertices,
      }
    }
    if (pointOfInterest) {
      this.store$.dispatch(
        atlasSelection.actions.selectPoint({
          point: pointOfInterest
        })
      )
    }
  }

  public clearPoint(){
    this.store$.dispatch(
      atlasSelection.actions.clearSelectedPoint()
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
      this.ctxMenuSvc.deepMerge(event.data)
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
                loc: nav.position as [number, number, number],
                space: this.templateSelected
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

  showDataset(feat: Feature): void {
    
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

  @ViewChild('voiFeatureEntryCmp')
  voiFeatureEntryCmp: EntryComponent

  async pullAllVoi(){
    if (this.voiFeatureEntryCmp){
      await wait(320)
      this.voiFeatureEntryCmp.pullAll()
    }
  }
}
