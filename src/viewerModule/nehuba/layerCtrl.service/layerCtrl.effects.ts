import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { forkJoin, of } from "rxjs";
import { mapTo, switchMap, withLatestFrom, filter, catchError, map, debounceTime, shareReplay, distinctUntilChanged, startWith, pairwise, tap } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiFeatureModel, SapiParcellationModel, SapiSpaceModel, SapiRegionModel } from "src/atlasComponents/sapi";
import { SapiVOIDataResponse, SapiVolumeModel } from "src/atlasComponents/sapi/type";
import { atlasAppearance, atlasSelection, userInteraction } from "src/state";
import { arrayEqual } from "src/util/array";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader } from "src/util/constants";
import { getNgLayersFromVolumesATP, getRegionLabelIndex } from "../config.service";
import { ParcVolumeSpec } from "../store/util";
import { PMAP_LAYER_NAME } from "../constants";

@Injectable()
export class LayerCtrlEffects {
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
      const sapiRegion = this.sapi.getRegion(atlas["@id"], parcellation["@id"], regions[0].name)
      return forkJoin([
        sapiRegion.getMapInfo(template["@id"]),
        sapiRegion.getMapUrl(template["@id"])
      ]).pipe(
        map(([mapInfo, mapUrl]) => 
          atlasAppearance.actions.addCustomLayer({
            customLayer: {
              clType: "customlayer/nglayer",
              id: PMAP_LAYER_NAME,
              source: `nifti://${mapUrl}`,
              shader: getShader({
                colormap: EnumColorMapName.VIRIDIS,
                highThreshold: mapInfo.max,
                lowThreshold: mapInfo.min,
                removeBg: true,
              })
            }
          })
        ),
        catchError(() => of(
          atlasAppearance.actions.removeCustomLayer({
            id: PMAP_LAYER_NAME
          })
        ))
      )
    }),
  ))

  onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    map(val => val as { atlas: SapiAtlasModel, parcellation: SapiParcellationModel, template: SapiSpaceModel }),
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

  private getNgLayers(atlas: SapiAtlasModel, parcellation: SapiParcellationModel, template: SapiSpaceModel){

    if (!!parcellation && !template) {
      throw new Error(`parcellation defined, but template not defined!`)
    }
    
    /**
     * some labelled maps (such as julich brain in big brain) do not have the volumes defined on the parcellation level.
     * While we have the URLs of these volumes (the method we use is also kind of hacky), and in theory, we could construct a volume object directly
     * It is probably better to fetch the correct volume object to begin with
     */
    const parcVolumes$ = !parcellation
      ? of([] as {volume: SapiVolumeModel, volumeMetadata: ParcVolumeSpec}[])
      : forkJoin([
        this.sapi.getParcellation(atlas["@id"], parcellation["@id"]).getRegions(template["@id"]).pipe(
          map(regions => {

            const volumeIdToRegionMap = new Map<string, {
              labelIndex: number
              region: SapiRegionModel
            }[]>()

            for (const r of regions) {
              const volumeId = r?.hasAnnotation?.visualizedIn?.["@id"]
              if (!volumeId) continue

              const labelIndex = getRegionLabelIndex(atlas, template, parcellation, r)
              if (!labelIndex) continue

              if (!volumeIdToRegionMap.has(volumeId)) {
                volumeIdToRegionMap.set(volumeId, [])
              }
              volumeIdToRegionMap.get(volumeId).push({
                labelIndex,
                region: r
              })
            }
            return volumeIdToRegionMap
          })
        ),
        this.sapi.getParcellation(atlas["@id"], parcellation["@id"]).getVolumes()
      ]).pipe(
        switchMap(([ volumeIdToRegionMap, volumes ]) => {
          const missingVolumeIds = Array.from(volumeIdToRegionMap.keys()).filter(id => volumes.map(v => v["@id"]).indexOf(id) < 0)

          const volumesFromParc: {volume: SapiVolumeModel, volumeMetadata: ParcVolumeSpec}[] = volumes.map(
            volume => {
              const found = volumeIdToRegionMap.get(volume["@id"])
              if (!found) return null

              try {

                const volumeMetadata: ParcVolumeSpec = {
                  regions: found,
                  parcellation,
                  volumeSrc: volume.data.url
                }
                return {
                  volume,
                  volumeMetadata,
                }
              } catch (e) {
                console.error(e)
                return null
              }
            }
          ).filter(v => v?.volumeMetadata?.regions)

          if (missingVolumeIds.length === 0) return of([...volumesFromParc])
          return forkJoin(
            missingVolumeIds.map(missingId => {
              if (!volumeIdToRegionMap.has(missingId)) {
                console.warn(`volumeIdToRegionMap does not have volume with id ${missingId}`)
                return of(null as SapiVolumeModel)
              }
              const { region } = volumeIdToRegionMap.get(missingId)[0]
              return this.sapi.getRegion(atlas["@id"], parcellation["@id"], region.name).getVolumeInstance(missingId).pipe(
                catchError((err, obs) => of(null as SapiVolumeModel))
              )
            })
          ).pipe(
            map((missingVolumes: SapiVolumeModel[]) => {

              const volumesFromRegion: { volume: SapiVolumeModel, volumeMetadata: ParcVolumeSpec }[] = missingVolumes.map(
                volume => {
                  if (!volume || !volumeIdToRegionMap.has(volume['@id'])) {
                    return null
                  }

                  try {

                    const found = volumeIdToRegionMap.get(volume['@id'])
                    const volumeMetadata: ParcVolumeSpec = {
                      regions: found,
                      parcellation,
                      volumeSrc: volume.data.url
                    }
                    return {
                      volume,
                      volumeMetadata
                    }
                  } catch (e) {
                    console.error(`volume from region error`, e)
                    return null
                  }
                }
              ).filter(
                v => !!v
              )

              return [
                ...volumesFromParc,
                ...volumesFromRegion
              ]
            })
          )
        })
      )
    
    const spaceVols$ = !!template
      ? this.sapi.getSpace(atlas["@id"], template["@id"]).getVolumes().pipe(
        shareReplay(1),
      )
      : of([] as SapiVolumeModel[])
    
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
    switchMap(({ atlas, parcellation, template }) => {
      return this.getNgLayers(atlas, parcellation, template).pipe(
        map(volumes => getNgLayersFromVolumesATP(volumes, { atlas, parcellation, template }))
      )
    }),
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

  constructor(private store: Store<any>,private sapi: SAPI){}
}