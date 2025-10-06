import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef, ViewChild, inject } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { BehaviorSubject, combineLatest, Observable, of } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, switchMap, take, takeUntil, withLatestFrom } from "rxjs/operators";
import { CONST, ARIA_LABELS, QUICKTOUR_DESC } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour";
import { EnumViewerEvt, TViewerEvtCtxData, TViewerEvent } from "../viewer.interface";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { DialogService } from "src/services/dialogService.service";
import { SAPI } from "src/atlasComponents/sapi";
import { Feature, SxplrAtlas, SxplrParcellation, SxplrRegion } from "src/atlasComponents/sapi/sxplrTypes"
import { atlasAppearance, atlasSelection, userInteraction, userPreference } from "src/state";
import { SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";
import { EntryComponent } from "src/features/entry/entry.component";
import { TFace, TSandsPoint, getCoord } from "src/util/types";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { generalActionError } from "src/state/actions";
import { enLabels } from "src/uiLabels";
import { UserLayerService } from "../nehuba/userLayers/service";
import { MatDialog, MatDialogRef, MatSnackBar } from "src/sharedModules";
import { ModularUserAnnotationToolService } from "src/atlasComponents/userAnnotations/tools/service";
import { PointAssignmentFull } from "src/atlasComponents/sapiViews/volumes/point-assignment-full/point-assignment-full.component";
import { Point } from "src/atlasComponents/userAnnotations/tools/point";
import { DoiTemplate } from "src/ui/doi/doi.component";
import { SXPLR_PREFIX } from "src/util/constants";

interface HasName {
  name: string
}

@Component({
  selector: 'iav-cmp-viewer-container',
  templateUrl: './viewerCmp.template.html',
  styleUrls: [
    './viewerCmp.style.scss'
  ],
  exportAs: 'iavCmpViewerCntr',
  providers: [
    DialogService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    DestroyDirective
  ]
})

export class ViewerCmp {

  DoiTemplate = DoiTemplate
  SXPLR_PREFIX = SXPLR_PREFIX

  public readonly destroy$ = inject(DestroyDirective).destroyed$

  @ViewChild('voiFeatureEntryCmp', { read: EntryComponent })
  voiCmp: EntryComponent

  @ViewChild('focusFeatureDialogTmpl')
  private focusFeatureDialog: TemplateRef<any>

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

  #useViewer$ = this.store$.pipe(
    select(atlasAppearance.selectors.useViewer)
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
    this.#useViewer$,
  ]).pipe(
    map(( [ currentMap, allAvailableRegions, fullSidenavExpanded, halfSidenavExpanded, useViewer ] ) => ({
      currentMap, allAvailableRegions, fullSidenavExpanded, halfSidenavExpanded, useViewer
    }))
  )

  #view2$ = combineLatest([
    this.store$.pipe(
      select(userPreference.selectors.showExperimental)
    )
  ]).pipe(
    map(([ showExperimental ]) => ({ showExperimental }))
  )

  atlasAppearanceState$ = combineLatest([
    this.store$.pipe(
      select(atlasAppearance.selectors.showDelineation)
    )
  ]).pipe(
    map(([ showDelineation ]) => {
      return {
        showDelineation
      }
    })
  )

  toggleParcellationDelineation(){
    this.store$.dispatch(
      atlasAppearance.actions.toggleParcDelineation()
    )
  }

  public view$ = combineLatest([
    this.#view0$,
    this.#view1$,
    this.atlasAppearanceState$,
    of(enLabels),
    this.#view2$,
  ]).pipe(
    map(([v0, v1, atlasAppearanceState, labels, v2]) => ({ ...v0, ...v1, ...atlasAppearanceState, labels, ...v2 })),
    map(({ selectedRegions, viewerMode, selectedFeature, selectedPoint, selectedTemplate, selectedParcellation, currentMap, allAvailableRegions, fullSidenavExpanded, halfSidenavExpanded, labels, useViewer, showDelineation, showExperimental }) => {
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

        labels,
        useViewer,
        showDelineation,
        showExperimental,
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
    private snackbar: MatSnackBar,
    private userLayerSvc: UserLayerService,
    private userAnnotSvc: ModularUserAnnotationToolService,
    private dialog: MatDialog,
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


    this.#selectedPoint$.pipe(
      takeUntil(this.destroy$),
      filter(point => !!point),
      withLatestFrom(
        this.store$.pipe(
          atlasSelection.fromRootStore.distinctATP()
        )
      )
    ).subscribe(([point, { template, parcellation }]) => {
      const ref = this.dialog.open(PointAssignmentFull, {
        data: {
          point, template, parcellation
        }
      })

      ref.afterClosed().subscribe(() => {
        this.store$.dispatch(
          atlasSelection.actions.clearSelectedPoint()
        )
      })
    })

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

    let openFeatureDialog: () => MatDialogRef<any> = null

    combineLatest([
      this.store$.pipe(
        select(userInteraction.selectors.selectedFeature),
        distinctUntilChanged((o, n) => o?.id === n?.id),
      ),
      this.store$.pipe(
        select(userPreference.selectors.showExperimental),
        distinctUntilChanged(),
      )
    ]).pipe(
      
    ).subscribe(([feature, experimentalFlag]) => {
      if (!!openFeatureDialog) {
        this.dialogSvc.deregisterAndCloseRestorableDialog(openFeatureDialog)
        openFeatureDialog = null
      }
      
      if (!!feature && experimentalFlag){
        this.dialogSvc.registerAndOpenRestorableDialog(
          () => this.dialog.open(this.focusFeatureDialog, {
            data: {
              feature
            },
            width: '75vw',
            height: '75vh'
          }),
          () => this.clearShownFeature()
        )
      }
    })

    this.store$.pipe(
      select(atlasSelection.selectors.viewerMode)
    ).subscribe(mode => {
      if (mode === "focusview:voi") {
        this.dialogSvc.closeRestorableDialogs()
      } else {
        this.dialogSvc.openRestorableDialogs()
      }
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

  public async bookmarkPoint(pointSpec: {point?: number[], face?: number, vertices?: number[]}, template: SxplrTemplate){
    const _ = await this.userAnnotSvc.getTool("Point")
    if (!_) {
      return
    }
    const { point } = pointSpec
    if (!point) {
      return
    }

    const { toolInstance } = _
    
    const pt = new Point({
      '@type': 'siibra-ex/annotation/point',
      space: {
        id: template.id
      },
      x: point[0],
      y: point[1],
      z: point[2],
    })
    toolInstance.addAnnotation(pt)
    this.snackbar.open(`Annotation added`)
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

  clearShownFeature(): void {
    
    this.store$.dispatch(
      userInteraction.actions.clearShownFeature()
    )
  }

  /**
   * 
   * @param position position in mm
   */
  navigateTo(position: number[]): void {
    this.store$.dispatch(
      atlasSelection.actions.navigateTo({
        navigation: {
          position: position.map(v => v*1e6)
        },
        animation: true,
      })
    )
  }

  @ViewChild('voiFeatureEntryCmp')
  voiFeatureEntryCmp: EntryComponent

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

  async handleClickOnRegionName(regionName: string, event: MouseEvent){
    const regions = await this.store$.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions),
      take(1)
    ).toPromise()

    const foundRegion = regions.find(r => r.name === regionName)
    if (!foundRegion) {
      this.store$.dispatch(
        generalActionError({
          message: `Region with name ${regionName} not found.`
        })
      )
      return
    }
    if (event.ctrlKey) {
      this.toggleRoi(foundRegion)
    } else {
      this.selectRoi(foundRegion)
    }
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
