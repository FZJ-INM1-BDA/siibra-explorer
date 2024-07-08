import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { EMPTY, forkJoin, merge, Observable, of, pipe } from "rxjs";
import { debounceTime, map, switchMap, withLatestFrom, filter, shareReplay, distinctUntilChanged } from "rxjs/operators";
import { SAPI } from "src/atlasComponents/sapi";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes"
import { atlasAppearance, atlasSelection } from "src/state";
import { ThreeSurferCustomLabelLayer, ThreeSurferCustomLayer } from "src/state/atlasAppearance/const";
import * as selectors from "./selectors"
import * as actions from "./actions"

export const fromATP = {
  getThreeSurfaces: (sapi: SAPI) => {
    return pipe(
      filter(
        ({ atlas, template, parcellation }: {atlas: SxplrAtlas, template: SxplrTemplate, parcellation: SxplrParcellation}) => !!atlas && !!template && !!parcellation
      ),
      switchMap(({ template, parcellation }: {atlas: SxplrAtlas, template: SxplrTemplate, parcellation: SxplrParcellation}) => {
        return forkJoin({
          surfaces: sapi.getSurfaceTemplateImage(template),
          labels: sapi.getTranslatedLabelledThreeMap(parcellation, template),
        })
      })
    )
  }
}

@Injectable()
export class ThreeSurferEffects {

  private onATP$ = this.store.pipe(
    atlasSelection.fromRootStore.distinctATP()
  )

  private selectedSurfaceId$ = this.store.pipe(
    select(selectors.getSelectedSurfaceVariant),
    distinctUntilChanged()
  )

  private threeSurferBaseCustomLayers$: Observable<ThreeSurferCustomLayer[]> = this.store.pipe(
    select(atlasAppearance.selectors.customLayers),
    map(
      cl => cl.filter(layer => 
        layer.clType === "baselayer/threesurfer" ||
        layer.clType === "baselayer/threesurfer-label/annot" ||
        layer.clType === "baselayer/threesurfer-label/gii-label"
      ) as ThreeSurferCustomLayer[]
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
      
      const defaultSurface = surfaces.find(s => s.variant === "pial") || surfaces[0]
      if (!defaultSurface) return EMPTY
      return of(
        actions.selectSurfaceVariant({
          variant: defaultSurface.variant
        })
      )
    })
  ))

  onSurfaceSelected = createEffect(() => this.selectedSurfaceId$.pipe(
    switchMap(variant => this.onATPDebounceThreeSurferLayers$.pipe(
      switchMap(({ surfaces }) => {
        if (surfaces.length === 0) return EMPTY
  
        const layers: ThreeSurferCustomLayer[] = []
        /**
         * select the pial or first one by default
         */
        const selectedSrc = surfaces.filter(surface => surface.variant === variant)
  
        for (const src of selectedSrc) {
          layers.push({
            
            clType: 'baselayer/threesurfer',
            id: src.id,
            name: src.id,
            laterality: src.laterality,
            source: src.url
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
      for (const key in labels) {
        const { laterality, url, clType } = labels[key]
        labelMaps.push({
          clType,
          id: `${url}-${laterality}`,
          laterality,
          source: url
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