import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef, ViewChild, inject } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, Observable, of } from "rxjs";
import { debounceTime, distinctUntilChanged, map, shareReplay, switchMap, takeUntil } from "rxjs/operators";
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { animate, state, style, transition, trigger } from "@angular/animations";
import { IQuickTourData } from "src/ui/quickTour";
import { EnumViewerEvt, TViewerEvtCtxData, TSupportedViewers, TViewerEvent } from "../viewer.interface";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { DialogService } from "src/services/dialogService.service";
import { SAPI } from "src/atlasComponents/sapi";
import { Feature, SxplrAtlas, SxplrParcellation, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { EntryComponent } from "src/features/entry/entry.component";
import { TFace, TSandsPoint, getCoord } from "src/util/types";
import { wait } from "src/util/fn";
import { DestroyDirective } from "src/util/directives/destroy.directive";

interface HasName {
  name: string
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
  ],
  providers: [
    DialogService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    DestroyDirective
  ]
})

export class ViewerCmp {

  public readonly destroy$ = inject(DestroyDirective).destroyed$

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

  #currentMap$ = combineLatest([
    this.#templateSelected$,
    this.#parcellationSelected$
  ]).pipe(
    switchMap(([tmpl, parc]) => tmpl && parc ? this.sapi.getLabelledMap(parc, tmpl) : of(null))
  )
  
  #fullNavBarSwitch$ = new BehaviorSubject<boolean>(false)
  #halfNavBarSwitch$ = new BehaviorSubject<boolean>(true)

  #view0$ = combineLatest([
    this.#selectedRegions$,
    this.#viewerMode$,
    this.#selectedFeature$,
    this.#selectedPoint$,
    this.#templateSelected$,
    this.#parcellationSelected$,
  ]).pipe(
    map(([ selectedRegions, viewerMode, selectedFeature, selectedPoint, selectedTemplate, selectedParcellation ]) => ({
      selectedRegions, viewerMode, selectedFeature, selectedPoint, selectedTemplate, selectedParcellation
    }))
  )

  #view1$ = combineLatest([
    this.#currentMap$,
    this.allAvailableRegions$,
    this.#fullNavBarSwitch$,
    this.#halfNavBarSwitch$,
  ]).pipe(
    map(( [ currentMap, allAvailableRegions, fullSidenavExpanded, halfSidenavExpanded ] ) => ({
      currentMap, allAvailableRegions, fullSidenavExpanded, halfSidenavExpanded
    }))
  )

  public view$ = combineLatest([
    this.#view0$,
    this.#view1$,
  ]).pipe(
    map(([v0, v1]) => ({ ...v0, ...v1 })),
    map(({ selectedRegions, viewerMode, selectedFeature, selectedPoint, selectedTemplate, selectedParcellation, currentMap, allAvailableRegions, fullSidenavExpanded, halfSidenavExpanded }) => {
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

      const parentIds = new Set(allAvailableRegions.flatMap(v => v.parentIds))

      const labelMappedRegionNames = currentMap && Object.keys(currentMap.indices) || []
      return {
        viewerMode,
        selectedRegions,
        selectedFeature,
        selectedPoint,
        selectedTemplate,
        selectedParcellation,
        labelMappedRegionNames,
        allAvailableRegions,
        leafRegions: allAvailableRegions.filter(r => !parentIds.has(r.id)),
        branchRegions: allAvailableRegions.filter(r => parentIds.has(r.id)),

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
        onlyShowMiniTray: selectedRegions.length === 0 && !viewerMode && !selectedFeature && !selectedPoint,
        fullSidenavExpanded,
        halfSidenavExpanded,
      }
    }),
    shareReplay(1),
  )

  @ViewChild('viewerStatusCtxMenu', { read: TemplateRef })
  private viewerStatusCtxMenu: TemplateRef<any>

  @ViewChild('lastViewedPointTmpl', { read: TemplateRef })
  private lastViewedPointTmpl: TemplateRef<unknown>

  @ViewChild('viewerStatusRegionCtxMenu', { read: TemplateRef })
  private viewerStatusRegionCtxMenu: TemplateRef<any>

  private templateSelected: SxplrTemplate

  constructor(
    private store$: Store<any>,
    private ctxMenuSvc: ContextMenuService<TViewerEvtCtxData<'threeSurfer' | 'nehuba'>>,
    private dialogSvc: DialogService,
    private cdr: ChangeDetectorRef,
    private sapi: SAPI,
  ){

    this.view$.pipe(
      takeUntil(this.destroy$),
      map(({ selectedFeature, selectedPoint, selectedRegions, viewerMode }) => ({
        selectedFeature,
        selectedPoint,
        selectedRegions,
        viewerMode,
      })),
      distinctUntilChanged((o, n) => {
        if (o.viewerMode !== n.viewerMode) {
          return false
        }
        if (o.selectedFeature?.id !== n.selectedFeature?.id) {
          return false
        }
        if (o.selectedPoint?.["@type"] !== n.selectedPoint?.["@type"]) {
          return false
        }
        if (
          n.selectedPoint?.["@type"] === "https://openminds.ebrains.eu/sands/CoordinatePoint"
          && o.selectedPoint?.["@type"] === "https://openminds.ebrains.eu/sands/CoordinatePoint"
        ) {
          const newCoords = n.selectedPoint.coordinates.map(v => v.value)
          const oldCoords = o.selectedPoint.coordinates.map(v => v.value)
          if ([0, 1, 2].some(idx => newCoords[idx] !== oldCoords[idx])) {
            return false
          }
        }
        if (o.selectedRegions.length !== n.selectedRegions.length) {
          return false
        }
        const oldRegNames = o.selectedRegions.map(r => r.name)
        const newRegName = n.selectedRegions.map(r => r.name)
        if (oldRegNames.some(name => !newRegName.includes(name))) {
          return false
        }
        return true
      }),
      debounceTime(16),
      map(({ selectedFeature, selectedRegions, selectedPoint, viewerMode }) => {
        return !!viewerMode
        || !!selectedFeature
        || selectedRegions.length > 0
        || !!selectedPoint
      })
    ).subscribe(flag => {
      this.#fullNavBarSwitch$.next(flag)
    })

    this.templateSelected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      t => this.templateSelected = t
    )

    combineLatest([
      this.templateSelected$,
      this.parcellationSelected$,
      this.selectedAtlas$,
    ]).pipe(
      takeUntil(this.destroy$),
      debounceTime(160),
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
    
    const cb: TContextMenuReg<TViewerEvtCtxData<'nehuba' | 'threeSurfer'>> = ({ append, context }) => {

      if (this.#lastSelectedPoint && this.lastViewedPointTmpl) {
        const { point, template, face, vertices } = this.#lastSelectedPoint
        append({
          tmpl: this.lastViewedPointTmpl,
          data: {
            point, face, vertices,
            template
          },
          order: 15
        })
      }
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
        hoveredRegions = ((context as TViewerEvtCtxData<'nehuba'>).payload.nehuba || []).reduce(
          (acc, curr) => acc.concat(...curr.regions),
          []
        )
      }

      if (context.viewerType === 'threeSurfer') {
        hoveredRegions = (context as TViewerEvtCtxData<'threeSurfer'>).payload.regions
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

    this.destroy$.subscribe(() => {
      this.ctxMenuSvc.deregister(cb)
    })

  }

  public clearRoi(): void{
    this.store$.dispatch(
      atlasSelection.actions.clearSelectedRegions()
    )
  }

  public selectRoi(roi: SxplrRegion) {
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
    this.#lastSelectedPoint = { ...pointSpec, template }

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
        atlasSelection.actions.selectATPById({
          templateId: template.id
        })
      )
      this.store$.dispatch(
        atlasSelection.actions.selectPoint({
          point: pointOfInterest
        })
      )
    }
  }
  #lastSelectedPoint: { point?: number[], face?: number, vertices?: number[], template: SxplrTemplate }

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
    await wait(320)
    if (this.voiFeatureEntryCmp){
      this.voiFeatureEntryCmp.pullAll()
    }
  }

  selectATPR(regParc: {region: SxplrRegion, parcellation: SxplrParcellation}){
    this.store$.dispatch(
      atlasSelection.actions.selectATPById({
        parcellationId: regParc?.parcellation.id,
        regionId: regParc?.region?.name
      })
    )
  }

  controlFullNav(flag: boolean){
    this.#fullNavBarSwitch$.next(flag)
  }

  controlHalfNav(flag: boolean) {
    this.#halfNavBarSwitch$.next(flag)
    if (flag && this.#fullyRestoreToken) {
      this.#fullNavBarSwitch$.next(flag)
      this.#fullyRestoreToken = false
    }
  }

  #fullyRestoreToken = false
  fullyClose(){
    this.#fullyRestoreToken = true
    this.controlFullNav(false)
    this.controlHalfNav(false)
  }

  nameEql(a: HasName, b: HasName){
    return a.name === b.name
  }

  handleViewerCtxEvent(event: TViewerEvent) {
    if (event.type === EnumViewerEvt.VIEWERLOADED) {
      this.viewerLoaded = event.data
      this.cdr.detectChanges()
      return
    }
    if (event.type === EnumViewerEvt.VIEWER_CTX) {
      this.ctxMenuSvc.deepMerge(event.data)
    }
  }
}
