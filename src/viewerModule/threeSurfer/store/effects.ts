import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { EMPTY, forkJoin, merge, Observable, of, pipe, throwError } from "rxjs";
import { debounceTime, map, switchMap, withLatestFrom, filter, take, shareReplay, tap, distinctUntilChanged } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiSpaceModel } from "src/atlasComponents/sapi";
import { atlasAppearance, atlasSelection } from "src/state";
import { ThreeSurferCustomLabelLayer, ThreeSurferCustomLayer } from "src/state/atlasAppearance/const";
import * as selectors from "./selectors"
import * as actions from "./actions"

export const fromATP = {
  getThreeSurfaces: (sapi: SAPI) => {
    return pipe(
      filter(
        ({ atlas, template, parcellation }: {atlas: SapiAtlasModel, template: SapiSpaceModel, parcellation: SapiParcellationModel}) => !!atlas && !!template && !!parcellation
      ),
      switchMap(({ atlas, template, parcellation }: {atlas: SapiAtlasModel, template: SapiSpaceModel, parcellation: SapiParcellationModel}) => 
        forkJoin({
          surfaces: sapi.getSpace(atlas["@id"], template["@id"]).getVolumes().pipe(
            map(
              volumes => volumes.filter(vol => vol.data.type === "gii")
            )
          ),
          labels: sapi.getParcellation(atlas["@id"], parcellation["@id"]).getVolumes().pipe(
            map(
              volumes => volumes.filter(vol =>
                vol.data.type === "gii-label" &&
                vol.data.space["@id"] === template["@id"]
              )
            )
          )
        })
      )
    )
  }
}

@Injectable()
export class ThreeSurferEffects {

  private onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP()
  )

  private selectedSurfaceId$ = this.store.pipe(
    select(selectors.getSelectedVolumeId),
    distinctUntilChanged()
  )

  private threeSurferBaseCustomLayers$: Observable<ThreeSurferCustomLayer[]> = this.store.pipe(
    select(atlasAppearance.selectors.customLayers),
    map(
      cl => cl.filter(layer => layer.clType === "baselayer/threesurfer") as ThreeSurferCustomLayer[]
    )
  )

  onATPClearBaseLayers = createEffect(() => merge(
    this.onATP$,
    this.selectedSurfaceId$,
  ).pipe(
    withLatestFrom(
      this.threeSurferBaseCustomLayers$
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

  public onATPDebounceThreeSurferLayers$ = this.onATP$.pipe(
    debounceTime(16),
    fromATP.getThreeSurfaces(this.sapi),
    shareReplay(1),
  )

  onATPDebounceHasSurfaceVolumes = createEffect(() => this.onATPDebounceThreeSurferLayers$.pipe(
    switchMap(({ surfaces }) => {
      const defaultSurface = surfaces.find(s => s.metadata.shortName === "pial") || surfaces[0]
      if (!defaultSurface) return EMPTY
      return of(
        actions.selectVolumeById({
          id: defaultSurface["@id"]
        })
      )
    })
  ))

  onSurfaceSelected = createEffect(() => this.selectedSurfaceId$.pipe(
    switchMap(id => this.onATPDebounceThreeSurferLayers$.pipe(
      switchMap(({ surfaces }) => {
        if (surfaces.length === 0) return EMPTY
  
        const layers: ThreeSurferCustomLayer[] = []
        /**
         * select the pial or first one by default
         */
        const selectedSrc = surfaces.find(s => s["@id"] === id)
  
        if (!(selectedSrc.data?.url_map)) {
          return throwError(`Expecting surfaces[0].data.url_map to be defined, but is not.`)
        }
  
        for (const key in selectedSrc.data.url_map) {
          layers.push({
            clType: 'baselayer/threesurfer',
            id: `${selectedSrc["@id"]}-${key}`,
            name: `${selectedSrc["@id"]}-${key}`,
            laterality: key as 'left' | 'right',
            source: selectedSrc.data.url_map[key]
          })
        }
        return of(...[
          ...layers.map(customLayer => 
            atlasAppearance.actions.addCustomLayer({
              customLayer
            })
          )
        ])
      })
    ))
  ))

  onATPDebounceAddBaseLayers$ = createEffect(() => this.onATPDebounceThreeSurferLayers$.pipe(
    switchMap(({ labels }) => {
      const labelMaps: ThreeSurferCustomLabelLayer[] = []
      for (const label of labels) {
        labelMaps.push({
          clType: 'baselayer/threesurfer-label',
          id: `${label["@id"]}-${label.metadata.shortName}`,
          laterality: label.metadata.shortName as 'left' | 'right',
          source: label.data.url
        })
      }
      return of(
        ...labelMaps.map(customLayer => 
          atlasAppearance.actions.addCustomLayer({
            customLayer
          })  
        )
      )
    })
  ))

  constructor(
    private store: Store,
    private sapi: SAPI,
  ){

  }
}