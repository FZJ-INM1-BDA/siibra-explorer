import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { of } from "rxjs";
import { mapTo, switchMap, withLatestFrom, filter, catchError, map, debounceTime, take, shareReplay, distinctUntilChanged } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { atlasAppearance, atlasSelection } from "src/state";
import { NgLayerCustomLayer } from "src/state/atlasAppearance";
import { arrayEqual } from "src/util/array";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader } from "src/util/constants";
import { fromRootStore } from "../config.service";
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
      return sapiRegion.getMapInfo(template["@id"])
        .then(val => 
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
        )
    }),
    catchError((err, obs) => of(
      atlasAppearance.actions.removeCustomLayer({
        id: NehubaLayerControlService.PMAP_LAYER_NAME
      })
    ))
  ))

  onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP(),
    map(val => val as { atlas: SapiAtlasModel, parcellation: SapiParcellationModel, template: SapiSpaceModel })
  )

  onATPClearBaseLayers = createEffect(() => this.onATP$.pipe(
    withLatestFrom(
      this.store.pipe(
        select(atlasAppearance.selectors.customLayers),
        map(
          cl => cl.filter(layer => layer.clType === "baselayer/nglayer" || layer.clType === "baselayer/colormap")
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
    switchMap(() => 
      this.store.pipe(
        fromRootStore.getNgLayers(this.store, this.sapi),
        take(1)
      )
    ),
    shareReplay(1)
  )

  onATPDebounceAddBaseLayers$ = createEffect(() => this.onATPDebounceNgLayers$.pipe(
    switchMap(ngLayers => {
      const { parcNgLayers, tmplAuxNgLayers, tmplNgLayers } = ngLayers
      
      const customBaseLayers: NgLayerCustomLayer[] = []
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