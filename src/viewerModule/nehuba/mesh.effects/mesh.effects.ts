import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { map, mapTo } from "rxjs/operators";
import { actionSetAuxMeshes, IAuxMesh } from "../store";
import { atlasSelection } from "src/state"
import { LayerCtrlEffects } from "../layerCtrl.service/layerCtrl.effects";

@Injectable()
export class MeshEffects{
  constructor(
    private store: Store<any>,
    private effect: LayerCtrlEffects,
  ){

  }

  onATPSelectResetAuxMeshes = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.selectedATP),
    mapTo(
      actionSetAuxMeshes({
        payload: []
      })
    )
  ))

  onNgLayersEmitSetAuxMeshes = createEffect(() => this.effect.onATPDebounceNgLayers$.pipe(
    map(({ tmplAuxNgLayers }) => {
      const newAuxMeshes: IAuxMesh[] = []
      for (const key in tmplAuxNgLayers) {
        
        for (const mesh of tmplAuxNgLayers[key].auxMeshes) {
          newAuxMeshes.push({
            "@id": `aux-mesh-${mesh.name}`,
            ngId: key,
            labelIndicies: mesh.labelIndicies,
            name: mesh.name,
            rgb: [255, 255, 255],
            visible: true,
            displayName: mesh.name
          })
        }
      }
      return actionSetAuxMeshes({
        payload: newAuxMeshes
      })
    })
  ))
}