import { Directive, Input, TemplateRef, inject } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { BehaviorSubject, Observable, combineLatest, from, of } from "rxjs";
import { catchError, distinctUntilChanged, last, map, mergeMap, shareReplay, switchMap, take, takeUntil, tap, toArray } from "rxjs/operators";
import { strToRgb } from "common/util";
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { SAPI } from "src/atlasComponents/sapi";
import { Feature, SxplrRegion, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { AnnotationLayer, TNgAnnotationAABBox } from "src/atlasComponents/annotations";
import { ContextMenuService, TContextMenuReg } from "src/contextMenuModule";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { getUuid } from "src/util/fn";
import { CustomDataSource } from "src/util/pullable";
import { TranslatedFeature } from "./list/list.directive";
import { isVoiData } from "./guards";

export type AnchorHighlightCtxMenuData = {
  /** capped to AnchorHighlightDirective.MAX_CTX_MENU_ITEMS */
  features: Feature[]
  /** how many anchored features beyond the displayed ones */
  remaining: number
  select: (feature: Feature) => void
}

@Directive({
  selector: '[anchor-highlight]',
  standalone: true,
  exportAs: "anchorHighlight",
  hostDirectives: [ DestroyDirective ],
})
export class AnchorHighlightDirective {

  static VOI_LAYER_COLOR = "#ffff00"
  static TRANSPARENT: [number, number, number, number] = [255, 255, 255, 0]

  static BATCH_SIZE = 10
  static MAX_CTX_MENU_ITEMS = 3

  readonly #destroy$ = inject(DestroyDirective).destroyed$
  readonly #store = inject(Store)
  readonly #sapi = inject(SAPI)
  readonly #ctxMenuSvc = inject(ContextMenuService)

  /** anchored features keyed by region name, for the context menu lookup */
  readonly #featuresByRegionName = new Map<string, Feature[]>()
  #hoveredRegions: SxplrRegion[] = []

  readonly #busy$ = new BehaviorSubject<boolean>(false)
  /** emits whether feature details are still being fetched */
  readonly busy$ = this.#busy$.pipe(
    distinctUntilChanged(),
  )

  /** unique ids so the custom layers can be referenced/removed on cleanup */
  readonly #colorMapLayerId = `anchor-highlight-colormap-${getUuid()}`
  readonly #annotationLayerName = `anchor-highlight-voi-${getUuid()}`

  #annotationLayer: AnnotationLayer
  #annotationIds: string[] = []

  readonly #datasource$ = new BehaviorSubject<CustomDataSource<TranslatedFeature>>(null)

  @Input()
  set datasource(ds: CustomDataSource<TranslatedFeature>) {
    this.#datasource$.next(ds)
  }

  /** ng-template used to render the anchored features in the context menu */
  @Input()
  ctxMenuTmpl: TemplateRef<{ $implicit: AnchorHighlightCtxMenuData }> | null = null

  /**
   * eagerly pull every feature from the datasource, then fetch the full
   * detail (incl. anchors, which the list view omits) for each feature in
   * batches of BATCH_SIZE.
   */
  readonly #features$: Observable<TranslatedFeature[]> = this.#datasource$.pipe(
    switchMap(ds => {
      if (!ds) {
        this.#busy$.next(false)
        return of([] as TranslatedFeature[])
      }
      this.#busy$.next(true)
      return ds.pullAll().pipe(
        // pullAll emits per fetched page; only the final emission has the
        // full set, so wait for it rather than re-fetching on each page
        last(),
        map(feats => feats.filter((f): f is TranslatedFeature => !!f)),
        switchMap(feats => {
          if (feats.length === 0) {
            return of([] as TranslatedFeature[])
          }
          return from(feats).pipe(
            mergeMap(
              feat => this.#sapi.getV3FeatureDetailWithId(feat.id).pipe(
                take(1),
                // on failure, fall back to the list feature (no anchors)
                catchError(() => of(feat)),
              ),
              AnchorHighlightDirective.BATCH_SIZE,
            ),
            toArray(),
          )
        }),
        tap(() => this.#busy$.next(false)),
      )
    }),
    takeUntil(this.#destroy$),
    shareReplay(1),
  )

  /**
   * names of regions actually mapped (labelled) in the current parcellation /
   * template. Only these regions carry a color the colormap can act on.
   */
  readonly #mappedRegionNames$ = combineLatest([
    this.#store.pipe(
      select(atlasSelection.selectors.selectedParcellation)
    ),
    this.#store.pipe(
      select(atlasSelection.selectors.selectedTemplate)
    ),
  ]).pipe(
    switchMap(([ parcellation, template ]) =>
      parcellation && template
        ? from(this.#sapi.getLabelledMap(parcellation, template))
        : of(null)
    ),
    map(labelledMap => new Set<string>(
      labelledMap ? Object.keys(labelledMap.indices) : []
    )),
    shareReplay(1),
  )

  constructor() {

    /**
     * features with .anchors populated -> highlight anchored regions via a
     * custom colormap, muting every other region to fully transparent.
     */
    combineLatest([
      this.#features$,
      this.#store.pipe(
        select(atlasSelection.selectors.selectedParcAllRegions)
      ),
      this.#mappedRegionNames$,
    ]).pipe(
      takeUntil(this.#destroy$),
    ).subscribe(([ features, allRegions, mappedRegionNames ]) => {
      this.#applyColorMap(features, allRegions, mappedRegionNames)
    })

    /**
     * features with .bbox (VoiFeature) -> draw an axis-aligned bounding box
     * via the annotation layer.
     */
    this.#features$.pipe(
      map(features => features.filter(isVoiData)),
      takeUntil(this.#destroy$),
    ).subscribe(voiFeatures => {
      this.#applyAnnotations(voiFeatures)
    })

    /**
     * index the anchored features by region name (resolving each anchored
     * region to itself and all its descendants in the parcellation tree), so
     * the context menu can look them up by the currently hovered leaf region.
     */
    combineLatest([
      this.#features$,
      this.#store.pipe(
        select(atlasSelection.selectors.selectedParcAllRegions)
      ),
    ]).pipe(
      takeUntil(this.#destroy$),
    ).subscribe(([ features, allRegions ]) => {
      this.#indexFeaturesByRegion(features, allRegions)
    })

    /**
     * track the currently hovered region(s)
     */
    this.#store.pipe(
      select(userInteraction.selectors.mousingOverRegions),
      takeUntil(this.#destroy$),
    ).subscribe(regions => {
      this.#hoveredRegions = regions || []
    })

    /**
     * register a context menu entry listing the features anchored to the
     * hovered region; clicking one shows that feature.
     */
    this.#ctxMenuSvc.register(this.#ctxMenuCb)

    this.#destroy$.subscribe(() => {
      this.#ctxMenuSvc.deregister(this.#ctxMenuCb)
      this.#removeColorMap()
      this.#disposeAnnotations()
    })
  }

  readonly #ctxMenuCb: TContextMenuReg<unknown> = ({ append }) => {
    if (!this.ctxMenuTmpl) {
      return true
    }
    const features = this.#collectHoveredFeatures()
    if (features.length === 0) {
      return true
    }
    const max = AnchorHighlightDirective.MAX_CTX_MENU_ITEMS
    const data: AnchorHighlightCtxMenuData = {
      features: features.slice(0, max),
      remaining: Math.max(0, features.length - max),
      select: feature => this.#selectFeature(feature),
    }
    append({
      tmpl: this.ctxMenuTmpl,
      data,
      order: 6,
    })
    return true
  }

  /** anchored features for the currently hovered region(s), de-duped by id */
  #collectHoveredFeatures(): Feature[] {
    const seen = new Set<string>()
    const features: Feature[] = []
    for (const region of this.#hoveredRegions) {
      for (const feature of this.#featuresByRegionName.get(region.name) || []) {
        if (seen.has(feature.id)) {
          continue
        }
        seen.add(feature.id)
        features.push(feature)
      }
    }
    return features
  }

  #selectFeature(feature: Feature) {
    this.#store.dispatch(
      userInteraction.actions.showFeature({ feature })
    )
    this.#ctxMenuSvc.dismissCtxMenu()
  }

  #applyColorMap(features: TranslatedFeature[], allRegions: SxplrRegion[], mappedRegionNames: Set<string>) {
    const anchoredRegionNames = new Set<string>()
    for (const feature of features) {
      const anchors = 'anchors' in feature ? feature.anchors : null
      for (const anchor of anchors || []) {
        anchoredRegionNames.add(anchor.region.name)
      }
    }

    if (anchoredRegionNames.size === 0) {
      this.#removeColorMap()
      return
    }

    // if the labelled map is unavailable, don't filter by mapped-ness
    const isMapped = (region: SxplrRegion) =>
      mappedRegionNames.size === 0 || mappedRegionNames.has(region.name)

    const childrenByParentId = this.#buildChildrenLookup(allRegions)

    // resolve each anchored region (which may be a branch in the tree) to the
    // set of mapped regions to colour: itself and/or its mapped descendants
    const regionsToHighlight = new Set<SxplrRegion>()
    for (const region of allRegions) {
      if (!anchoredRegionNames.has(region.name)) {
        continue
      }
      for (const descendant of this.#getRegionWithDescendants(region, childrenByParentId)) {
        if (isMapped(descendant)) {
          regionsToHighlight.add(descendant)
        }
      }
    }

    if (regionsToHighlight.size === 0) {
      this.#removeColorMap()
      return
    }

    const colormap = new WeakMap<SxplrRegion, number[]>()
    for (const region of allRegions) {
      colormap.set(
        region,
        regionsToHighlight.has(region)
          ? (region.color || strToRgb(region.name))
          : AnchorHighlightDirective.TRANSPARENT
      )
    }

    this.#store.dispatch(
      atlasAppearance.actions.addCustomLayers({
        customLayers: [{
          clType: 'customlayer/colormap',
          id: this.#colorMapLayerId,
          colormap,
        }]
      })
    )
  }

  /**
   * map every anchored region - and all of its descendants in the parcellation
   * tree - back to the owning feature, so a hover on any (leaf) region surfaces
   * the features anchored to it or any of its ancestors.
   */
  #indexFeaturesByRegion(features: TranslatedFeature[], allRegions: SxplrRegion[]) {
    this.#featuresByRegionName.clear()

    const childrenByParentId = this.#buildChildrenLookup(allRegions)
    const regionsByName = new Map<string, SxplrRegion[]>()
    for (const region of allRegions) {
      const entries = regionsByName.get(region.name) || []
      entries.push(region)
      regionsByName.set(region.name, entries)
    }

    const addEntry = (regionName: string, feature: Feature) => {
      const entries = this.#featuresByRegionName.get(regionName) || []
      if (!entries.includes(feature)) {
        entries.push(feature)
      }
      this.#featuresByRegionName.set(regionName, entries)
    }

    for (const feature of features) {
      if (!('anchors' in feature)) {
        continue
      }
      for (const anchor of feature.anchors || []) {
        const anchorRegions = regionsByName.get(anchor.region.name) || []
        if (anchorRegions.length === 0) {
          // anchored region not in the current parcellation tree; index it
          // directly so a direct hover still works
          addEntry(anchor.region.name, feature)
          continue
        }
        for (const region of anchorRegions) {
          for (const descendant of this.#getRegionWithDescendants(region, childrenByParentId)) {
            addEntry(descendant.name, feature)
          }
        }
      }
    }
  }

  /** children lookup for the parcellation tree, keyed by parent region id */
  #buildChildrenLookup(allRegions: SxplrRegion[]): Map<string, SxplrRegion[]> {
    const childrenByParentId = new Map<string, SxplrRegion[]>()
    for (const region of allRegions) {
      for (const parentId of region.parentIds) {
        const siblings = childrenByParentId.get(parentId) || []
        siblings.push(region)
        childrenByParentId.set(parentId, siblings)
      }
    }
    return childrenByParentId
  }

  /** the region itself plus every descendant, walking the parcellation tree */
  #getRegionWithDescendants(region: SxplrRegion, childrenByParentId: Map<string, SxplrRegion[]>): SxplrRegion[] {
    const collected = new Set<SxplrRegion>([region])
    const stack: SxplrRegion[] = [region]
    let current: SxplrRegion | undefined
    while ((current = stack.pop())) {
      for (const child of childrenByParentId.get(current.id) || []) {
        if (!collected.has(child)) {
          collected.add(child)
          stack.push(child)
        }
      }
    }
    return [...collected]
  }

  #removeColorMap() {
    this.#store.dispatch(
      atlasAppearance.actions.removeCustomLayers({
        customLayers: [{ id: this.#colorMapLayerId }]
      })
    )
  }

  #applyAnnotations(voiFeatures: VoiFeature[]) {
    if (!this.#annotationLayer || this.#annotationLayer.disposed) {
      this.#annotationLayer = new AnnotationLayer(
        this.#annotationLayerName,
        AnchorHighlightDirective.VOI_LAYER_COLOR,
      )
    }

    // clear previously drawn boxes before drawing the current set
    for (const id of this.#annotationIds) {
      this.#annotationLayer.removeAnnotation({ id })
    }
    this.#annotationIds = []

    const annotations = voiFeatures.map(feature => this.#bboxToAABB(feature))
    this.#annotationIds = annotations.map(ann => ann.id)
    if (annotations.length > 0) {
      this.#annotationLayer.addAnnotation(annotations)
    }
  }

  #bboxToAABB(feature: VoiFeature): TNgAnnotationAABBox {
    const { minpoint, maxpoint } = feature.bbox
    return {
      id: `${feature.id}-anchor-highlight-box`,
      type: "aabbox",
      // bbox is in mm, nehuba annotations expect nm
      pointA: minpoint.map(v => v * 1e6) as [number, number, number],
      pointB: maxpoint.map(v => v * 1e6) as [number, number, number],
    }
  }

  #disposeAnnotations() {
    if (this.#annotationLayer && !this.#annotationLayer.disposed) {
      this.#annotationLayer.dispose()
    }
    this.#annotationLayer = null
    this.#annotationIds = []
  }
}
