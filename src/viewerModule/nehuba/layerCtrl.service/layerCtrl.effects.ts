import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { forkJoin, of } from "rxjs";
import { mapTo, switchMap, withLatestFrom, filter, catchError, map, debounceTime, shareReplay, distinctUntilChanged, startWith, pairwise } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiFeatureModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { SapiVOIDataResponse } from "src/atlasComponents/sapi/type";
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { arrayEqual } from "src/util/array";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader } from "src/util/constants";
import { getNgLayersFromVolumesATP, getRegionLabelIndex } from "../config.service";
import { ParcVolumeSpec } from "../store/util";
import { NehubaLayerControlService } from "./layerCtrl.service";

@Injectable()
export class LayerCtrlEffects {
  onRegionSelectClearPmapLayer = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.selectedRegions),
    distinctUntilChanged(
      arrayEqual((o, n) => o["@id"] === n["@id"])
    ),
    mapTo(
      atlasAppearance.actions.removeCustomLayer({
        id: NehubaLayerControlService.PMAP_LAYER_NAME
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
      const sapiRegion = this.sapi.getRegion(atlas["@id"], parcellation["@id"], regions[0].name)
      return sapiRegion.getMapInfo(template["@id"]).pipe(
        map(val => 
          atlasAppearance.actions.addCustomLayer({
            customLayer: {
              clType: "customlayer/nglayer",
              id: NehubaLayerControlService.PMAP_LAYER_NAME,
              source: `nifti://${sapiRegion.getMapUrl(template["@id"])}`,
              shader: getShader({
                colormap: EnumColorMapName.VIRIDIS,
                highThreshold: val.max,
                lowThreshold: val.min,
                removeBg: true,
              })
            }
          })
        ),
        catchError((err, obs) => of(
          atlasAppearance.actions.removeCustomLayer({
            id: NehubaLayerControlService.PMAP_LAYER_NAME
          })
        ))
      )
    }),
  ))

  onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    map(val => val as { atlas: SapiAtlasModel, parcellation: SapiParcellationModel, template: SapiSpaceModel })
  )

  onShownFeature = createEffect(() => this.store.pipe(
    select(userInteraction.selectors.selectedFeature),
    startWith(null as SapiFeatureModel),
    pairwise(),
    map(([ prev, curr ]) => {
      const removeLayers: atlasAppearance.NgLayerCustomLayer[] = []
      const addLayers: atlasAppearance.NgLayerCustomLayer[] = []
      if (prev?.["@type"] === "siibra/features/voi") {
        removeLayers.push(
          ...(prev as SapiVOIDataResponse).volumes.map(v => {
            return {
              id: v.metadata.fullName,
              clType: "customlayer/nglayer",
              source: v.data.url,
              transform: v.data.detail['neuroglancer/precomputed']['transform'],
              opacity: 1.0,
              visible: true,
              shader: v.data.detail['neuroglancer/precomputed']['shader'] || getShader()
            } as atlasAppearance.NgLayerCustomLayer
          })
        )
      }
      if (curr?.["@type"] === "siibra/features/voi") {
        addLayers.push(
          ...(curr as SapiVOIDataResponse).volumes.map(v => {
            return {
              id: v.metadata.fullName,
              clType: "customlayer/nglayer",
              source: `precomputed://${v.data.url}`,
              transform: v.data.detail['neuroglancer/precomputed']['transform'],
              opacity: v.data.detail['neuroglancer/precomputed']['opacity'] || 1.0,
              visible: true,
              shader: v.data.detail['neuroglancer/precomputed']['shader'] || getShader()
            } as atlasAppearance.NgLayerCustomLayer
          })
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
          cl => cl.filter(layer => layer.clType === "baselayer/nglayer" || "customlayer/nglayer")
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

  private getNgLayers(atlas: SapiAtlasModel, parcellation: SapiParcellationModel, template: SapiSpaceModel){

    if (!!parcellation && !template) {
      throw new Error(`parcellation defined, but template not defined!`)
    }
    
    const parcVolumes$ = !parcellation
    ? of([])
    : forkJoin([
        this.sapi.getParcellation(atlas["@id"], parcellation["@id"]).getRegions(template["@id"]).pipe(
          map(regions => {

            const returnArr: ParcVolumeSpec[] = []
            for (const r of regions) {
              const source = r?.hasAnnotation?.visualizedIn?.["@id"]
              if (!source) continue
              if (source.indexOf("precomputed://") < 0) continue
              const labelIndex = getRegionLabelIndex(atlas, template, parcellation, r)
              if (!labelIndex) continue
              
              const found = returnArr.find(v => v.volumeSrc === source)
              if (found) {
                found.labelIndicies.push(labelIndex)
                continue
              }

              let laterality: "left hemisphere" | "right hemisphere" | "whole brain" = "whole brain"
              if (r.name.indexOf("left") >= 0) laterality = "left hemisphere"
              if (r.name.indexOf("right") >= 0) laterality = "right hemisphere"
              returnArr.push({
                volumeSrc: source,
                labelIndicies: [labelIndex],
                parcellation,
                laterality,
              })
            }
            return returnArr
          })
        ),
        this.sapi.getParcellation(atlas["@id"], parcellation["@id"]).getVolumes()
      ]).pipe(
        map(([ volumeSrcs, volumes ]) => {
          return volumes.map(
            v => {
              const found = volumeSrcs.find(volSrc => volSrc.volumeSrc.indexOf(v.data.url) >= 0)
              return {
                volume: v,
                volumeMetadata: found,
              }
            }).filter(
            v => !!v.volumeMetadata?.labelIndicies
          )
        })
      )
    
    const spaceVols$ = !!template
    ? this.sapi.getSpace(atlas["@id"], template["@id"]).getVolumes().pipe(
        shareReplay(1),
      )
    : of([])
    
    return forkJoin({
      tmplVolumes: spaceVols$.pipe(
        map(
          volumes => volumes.filter(vol => "neuroglancer/precomputed" in vol.data.detail)
        ),
      ),
      tmplAuxMeshVolumes: spaceVols$.pipe(
        map(
          volumes => volumes.filter(vol => "neuroglancer/precompmesh" in vol.data.detail)
        ),
      ),
      parcVolumes: parcVolumes$.pipe(
      )
    })
  }

  onATPDebounceNgLayers$ = this.onATP$.pipe(
    debounceTime(16),
    switchMap(({ atlas, parcellation, template }) => 
      this.getNgLayers(atlas, parcellation, template).pipe(
        map(volumes => getNgLayersFromVolumesATP(volumes, { atlas, parcellation, template }))
      )
    ),
    shareReplay(1)
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
  ){

  }
}