import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { of } from "rxjs";
import { mapTo, switchMap, withLatestFrom, filter, catchError } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { atlasAppearance, atlasSelection } from "src/state";
import { EnumColorMapName } from "src/util/colorMaps";
import { getShader } from "src/util/constants";
import { NehubaLayerControlService } from "./layerCtrl.service";

@Injectable()
export class LayerCtrlEffects {
  onRegionSelectClearPmapLayer = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.selectedRegions),
    withLatestFrom(this.store.pipe(
      select(atlasSelection.selectors.selectedATP)
    )),
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
        select(atlasSelection.selectors.selectedATP)
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

  constructor(
    private store: Store<any>,
    private sapi: SAPI,  
  ){

  }
}