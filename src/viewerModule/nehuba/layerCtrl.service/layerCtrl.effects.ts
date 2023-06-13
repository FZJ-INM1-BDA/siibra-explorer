import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { forkJoin, from, of } from "rxjs";
import { switchMap, withLatestFrom, filter, catchError, map, debounceTime, shareReplay, distinctUntilChanged, startWith, pairwise, tap } from "rxjs/operators";
import { Feature, NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, SxplrAtlas, SxplrParcellation, SxplrTemplate, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { SAPI } from "src/atlasComponents/sapi"
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { arrayEqual } from "src/util/array";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader } from "src/util/constants";
import { PMAP_LAYER_NAME } from "../constants";
import { QuickHash } from "src/util/fn";
import { getParcNgId } from "../config.service";

@Injectable()
export class LayerCtrlEffects {
  static TransformVolumeModel(volumeModel: VoiFeature['ngVolume']): atlasAppearance.const.NgLayerCustomLayer[] {    
    return [{
      clType: "customlayer/nglayer",
      id: volumeModel.url,
      source: `precomputed://${volumeModel.url}`,
      transform: volumeModel.transform,
    }]
  }

  #onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    map(val => val as { atlas: SxplrAtlas, parcellation: SxplrParcellation, template: SxplrTemplate }),
  )


  #pmapUrl: string
  #cleanupUrl(){
    if (!!this.#pmapUrl) {
      URL.revokeObjectURL(this.#pmapUrl)
      this.#pmapUrl = null
    }
  }

  onRegionSelect = createEffect(() => this.store.pipe(
    select(atlasAppearance.selectors.useViewer),
    switchMap(viewer => {
      const rmPmapAction = atlasAppearance.actions.removeCustomLayer({
        id: PMAP_LAYER_NAME
      })
      if (viewer !== "NEHUBA") {
        this.#cleanupUrl()
        return of(rmPmapAction)
      }
      return this.store.pipe(
        select(atlasSelection.selectors.selectedRegions),
        distinctUntilChanged(
          arrayEqual((o, n) => o.name === n.name)
        ),
        withLatestFrom(this.#onATP$),
        // since region selection changed, pmap will definitely be removed. revoke the url resource.
        tap(() => this.#cleanupUrl()),
        switchMap(([ regions, { parcellation, template } ]) => {
          if (regions.length !== 1) {
            return of(rmPmapAction)
          }
          return this.sapi.getStatisticalMap(parcellation, template, regions[0]).pipe(
            switchMap(({ buffer, meta }) => {
              this.#pmapUrl = URL.createObjectURL(new Blob([buffer], {type: "application/octet-stream"}))
              return of(
                rmPmapAction,
                atlasAppearance.actions.addCustomLayer({
                  customLayer: {
                    clType: "customlayer/nglayer",
                    id: PMAP_LAYER_NAME,
                    source: `nifti://${this.#pmapUrl}`,
                    shader: getShader({
                      colormap: EnumColorMapName.VIRIDIS,
                      highThreshold: meta.max,
                      lowThreshold: meta.min,
                      removeBg: true,
                    })
                  }
                })
              )
            }),
            catchError(() => of(rmPmapAction)),
          )
        })
      )
    })
  ))

  onShownFeature = createEffect(() => this.store.pipe(
    select(userInteraction.selectors.selectedFeature),
    startWith(null as Feature),
    pairwise(),
    map(([ prev, curr ]) => {
      const removeLayers: atlasAppearance.const.NgLayerCustomLayer[] = []
      const addLayers: atlasAppearance.const.NgLayerCustomLayer[] = []
      
      /**
       * TODO: use proper guard functions
       */
      if (!!prev?.['bbox']) {
        const prevVoi = prev as VoiFeature
        prevVoi.bbox
        removeLayers.push(
          ...LayerCtrlEffects.TransformVolumeModel(prevVoi.ngVolume)
        )
      }
      if (!!curr?.['bbox']) {
        const currVoi = curr as VoiFeature
        addLayers.push(
          ...LayerCtrlEffects.TransformVolumeModel(currVoi.ngVolume)
        )
      }
      return { removeLayers, addLayers }
    }),
    filter(({ removeLayers, addLayers }) => removeLayers.length !== 0 || addLayers.length !== 0),
    switchMap(({ removeLayers, addLayers }) => of(...[
      ...removeLayers.map(
        l => atlasAppearance.actions.removeCustomLayer({ id: l.id })
      ),
      ...addLayers.map(
        l => atlasAppearance.actions.addCustomLayer({ customLayer: l })
      )
    ]))
  ))

  onATPClearBaseLayers = createEffect(() => this.#onATP$.pipe(
    withLatestFrom(
      this.store.pipe(
        select(atlasAppearance.selectors.customLayers),
        map(
          cl => cl.filter(layer =>
            layer.clType === "baselayer/nglayer"
            || layer.clType === "customlayer/nglayer"
          )
        )
      )
    ),
    switchMap(([_, layers]) => 
      of(
        ...layers.map(layer => 
          atlasAppearance.actions.removeCustomLayer({
            id: layer.id
          })  
        )
      )
    )
  ))

  onATPDebounceNgLayers$ = this.#onATP$.pipe(
    debounceTime(16),
    switchMap(({ atlas, template, parcellation }) => 
      forkJoin({
        tmplNgLayers: this.sapi.getVoxelTemplateImage(template).pipe(
          map(templateImages => {
            const returnObj: Record<string, NgLayerSpec> = {}
            for (const img of templateImages) {
              returnObj[QuickHash.GetHash(img.source)] = img
            }
            return returnObj
          })
        ),
        tmplAuxNgLayers: this.sapi.getVoxelAuxMesh(template).pipe(
          map(auxMeshes => {
            const returnObj: Record<string, NgPrecompMeshSpec> = {}
            for (const img of auxMeshes) {
              returnObj[QuickHash.GetHash(`${img.source}_auxMesh`)] = img
            }
            return returnObj
          })
        ),
        parcNgLayers: from(this.sapi.getTranslatedLabelledNgMap(parcellation, template)).pipe(
          map(val => {
            const returnVal: Record<string, NgSegLayerSpec> = {}
            for (const [ /** url */, { layer, region } ] of Object.entries(val)) {
              const { name } = region[0]
              const ngId = getParcNgId(atlas, template, parcellation, {
                id: '',
                name,
                parentIds: [],
                type: "SxplrRegion"
              })
              returnVal[ngId] = layer
              continue
            }
            return returnVal
          })
        )
      })
    ),
    shareReplay(1),
  )

  onATPDebounceAddBaseLayers$ = createEffect(() => this.onATPDebounceNgLayers$.pipe(
    switchMap(ngLayers => {
      const { parcNgLayers, tmplAuxNgLayers, tmplNgLayers } = ngLayers
      
      const customBaseLayers: atlasAppearance.const.NgLayerCustomLayer[] = []
      for (const layers of [parcNgLayers, tmplAuxNgLayers, tmplNgLayers]) {
        for (const key in layers) {
          const { source, transform, opacity, visible } = layers[key]
          customBaseLayers.push({
            clType: "baselayer/nglayer",
            id: key,
            source,
            transform,
            opacity,
            visible,
          })
        }
      }
      return of(
        ...customBaseLayers.map(layer => 
          atlasAppearance.actions.addCustomLayer({
            customLayer: layer
          })  
        )
      )
    })
  ))

  constructor(
    private store: Store<any>,
    private sapi: SAPI,
  ){}
}