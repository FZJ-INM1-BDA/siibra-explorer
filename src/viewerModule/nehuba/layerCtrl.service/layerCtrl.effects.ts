import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { forkJoin, from, of, throwError } from "rxjs";
import { mapTo, switchMap, withLatestFrom, filter, catchError, map, debounceTime, shareReplay, distinctUntilChanged, startWith, pairwise, tap } from "rxjs/operators";
import { NgSegLayerSpec, SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/type_sxplr";
import { SAPI } from "src/atlasComponents/sapi"
import { 
  SapiFeatureModel,
  SapiSpatialFeatureModel,
} from "src/atlasComponents/sapi/type_v3";
import { translateV3Entities } from "src/atlasComponents/sapi/translate_v3"
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { arrayEqual } from "src/util/array";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader } from "src/util/constants";
import { PMAP_LAYER_NAME } from "../constants";
import { QuickHash } from "src/util/fn";
import { BaseService } from "../base.service/base.service";
import { getParcNgId } from "../config.service";

@Injectable()
export class LayerCtrlEffects {
  static TransformVolumeModel(volumeModel: SapiSpatialFeatureModel['volume']): atlasAppearance.NgLayerCustomLayer[] {
    /**
     * TODO implement
     */
    throw new Error(`IMPLEMENT ME`)
    for (const volumeFormat in volumeModel.providedVolumes) {

    }
    
    return []
  }

  onRegionSelectClearPmapLayer = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.selectedRegions),
    distinctUntilChanged(
      arrayEqual((o, n) => o["@id"] === n["@id"])
    ),
    mapTo(
      atlasAppearance.actions.removeCustomLayer({
        id: PMAP_LAYER_NAME
      })
    )
  ))

  onRegionSelectShowNewPmapLayer = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.selectedRegions),
    filter(regions => regions.length > 0),
    withLatestFrom(
      this.store.pipe(
        atlasSelection.fromRootStore.distinctATP()
      )
    ),
    switchMap(([ regions, { atlas, parcellation, template } ]) => {
      return throwError(`IMPLEMENT PMAP LAYER YO`)
      const actions = [
        atlasAppearance.actions.addCustomLayer({
          customLayer: {
            clType: "customlayer/nglayer",
            id: PMAP_LAYER_NAME,
            source: `nifti://${regions['url']}`,
            shader: getShader({
              colormap: EnumColorMapName.VIRIDIS,
              // highThreshold: [regions['']].max,
              // lowThreshold: [regions['']].min,
              removeBg: true,
            })
          }
        }),
        
        /**
         * on error, remove layer
         */
        atlasAppearance.actions.removeCustomLayer({
          id: PMAP_LAYER_NAME
        })
      ]
    }),
  ), { dispatch: false })

  onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    map(val => val as { atlas: SxplrAtlas, parcellation: SxplrParcellation, template: SxplrTemplate }),
  )

  onShownFeature = createEffect(() => this.store.pipe(
    select(userInteraction.selectors.selectedFeature),
    startWith(null as SapiFeatureModel),
    pairwise<SapiFeatureModel>(),
    map(([ prev, curr ]) => {
      const removeLayers: atlasAppearance.NgLayerCustomLayer[] = []
      const addLayers: atlasAppearance.NgLayerCustomLayer[] = []
      if (prev?.["@type"].includes("feature/volume_of_interest")) {
        const prevVoi = prev as SapiSpatialFeatureModel
        removeLayers.push(
          ...LayerCtrlEffects.TransformVolumeModel(prevVoi.volume)
        )
      }
      if (curr?.["@type"].includes("feature/volume_of_interest")) {
        const currVoi = curr as SapiSpatialFeatureModel
        addLayers.push(
          ...LayerCtrlEffects.TransformVolumeModel(currVoi.volume)
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

  onATPClearBaseLayers = createEffect(() => this.onATP$.pipe(
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

  onATPDebounceNgLayers$ = this.onATP$.pipe(
    debounceTime(16),
    switchMap(({ atlas, template, parcellation }) => 
      forkJoin({
        tmplNgLayers: this.sapi.getVoxelTemplateImage(template).pipe(
          map(templateImages => {
            const returnObj = {}
            for (const img of templateImages) {
              returnObj[QuickHash.GetHash(img.source)] = img
            }
            return returnObj
          })
        ),
        tmplAuxNgLayers: this.sapi.getVoxelAuxMesh(template).pipe(
          map(auxMeshes => {
            const returnObj = {}
            for (const img of auxMeshes) {
              returnObj[QuickHash.GetHash(`${img.source}_auxMesh`)] = img
            }
            return returnObj
          })
        ),
        parcNgLayers: from(this.sapi.getTranslatedLabelledNgMap(parcellation, template)).pipe(
          map(val => {
            const returnVal: Record<string, NgSegLayerSpec> = {}
            for (const [ url, { layer, region } ] of Object.entries(val)) {
              const { name } = region[0]
              const ngId = getParcNgId(atlas, template, parcellation, {
                id: '',
                name,
                parentIds: []
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
      
      const customBaseLayers: atlasAppearance.NgLayerCustomLayer[] = []
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
    private baseService: BaseService,
  ){}
}