import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { forkJoin, of } from "rxjs";
import { distinctUntilChanged, map, switchMap } from "rxjs/operators";
import * as atlasSelection from "src/state/atlasSelection";
import * as atlasAppearance from "src/state/atlasAppearance"
import { SAPI } from "src/atlasComponents/sapi";

@Injectable()
export class ViewerCommonEffects {
  onATPSetUseViewer$ = createEffect(() => this.store.pipe(
    select(atlasSelection.selectors.standaloneVolumes),
    distinctUntilChanged((o, n) => o?.length === n?.length),
    switchMap(volumes => volumes?.length > 0
      ? of( atlasAppearance.const.useViewer.NEHUBA )
      : this.store.pipe(
        select(atlasSelection.selectors.selectedTemplate),
        distinctUntilChanged((o, n) => o?.id === n?.id),
        switchMap(template => {
          if (!template) {
            return of(null as atlasAppearance.const.UseViewer)
          }
          return forkJoin({
            voxel: this.sapi.getVoxelTemplateImage(template),
            surface: this.sapi.getSurfaceTemplateImage(template)
          }).pipe(
            map(vols => {
              if (!vols) return null
              const { voxel, surface } = vols
              if (voxel.length > 0 && surface.length > 0) {
                console.error(`both voxel and surface length are > 0, this should not happen.`)
                return atlasAppearance.const.useViewer.NOT_SUPPORTED
              }
              if (voxel.length > 0) {
                return atlasAppearance.const.useViewer.NEHUBA
              }
              if (surface.length > 0) {
                return atlasAppearance.const.useViewer.THREESURFER
              }
              return atlasAppearance.const.useViewer.NOT_SUPPORTED
            })
          )
        })
      )
    ),
    map(viewer => atlasAppearance.actions.setUseViewer({ viewer }))
  ))

  constructor(private store: Store, private sapi: SAPI){

  }
}
