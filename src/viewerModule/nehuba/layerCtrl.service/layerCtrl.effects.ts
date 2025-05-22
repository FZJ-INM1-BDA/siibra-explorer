import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { concat, forkJoin, from, of } from "rxjs";
import { switchMap, withLatestFrom, catchError, map, debounceTime, shareReplay, distinctUntilChanged, tap, pairwise } from "rxjs/operators";
import { NgLayerSpec, NgPrecompMeshSpec, NgSegLayerSpec, SxplrAtlas, SxplrParcellation, SxplrTemplate, VoiFeature } from "src/atlasComponents/sapi/sxplrTypes";
import { SAPI } from "src/atlasComponents/sapi"
import { atlasAppearance, atlasSelection } from "src/state";
import { arrayEqual } from "src/util/array";
import { getShader } from "src/util/fn";
import { PMAP_LAYER_NAME } from "../constants";
import { QuickHash } from "src/util/fn";
import { getParcNgId } from "../config.service";
import { SXPLR_ANNOTATIONS_KEY } from "src/util/constants";

@Injectable()
export class LayerCtrlEffects {
  static TransformVolumeModel(volumeModel: VoiFeature['ngVolume']): atlasAppearance.const.NgLayerCustomLayer[] {    
    return [{
      clType: "customlayer/nglayer",
      legacySpecFlag: "old",
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
      const rmPmapAction = atlasAppearance.actions.removeCustomLayers({
        customLayers: [{id: PMAP_LAYER_NAME}]
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
                atlasAppearance.actions.addCustomLayers({
                  customLayers: [{
                    legacySpecFlag: "old",
                    clType: "customlayer/nglayer",
                    id: PMAP_LAYER_NAME,
                    source: `nifti://${this.#pmapUrl}`,
                    shader: getShader({
                      colormap: "viridis",
                      highThreshold: meta.max,
                      lowThreshold: meta.min,
                      removeBg: true,
                    }),
                    type: 'image',
                    opacity: 0.5
                  }]
                })
              )
            }),
            catchError(() => of(rmPmapAction)),
          )
        })
      )
    })
  ))


  onATPDebounceNgLayers$ = this.#onATP$.pipe(
    debounceTime(16),
    switchMap(({ atlas, template, parcellation }) => 
      forkJoin({
        tmplNgLayers: this.sapi.getVoxelTemplateImage(template).pipe(
          map(templateImages => {
            const returnObj: Record<string, NgLayerSpec> = {}
            for (const img of templateImages) {
              const url = typeof img.source === "string"
              ? img.source
              : img.source.url
              returnObj[QuickHash.GetHash(url)] = img
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
        ),
        sxplrAnnotations: of({
          [SXPLR_ANNOTATIONS_KEY.TEMPLATE_ID]: template?.id,
          [SXPLR_ANNOTATIONS_KEY.PARCELLATION_ID]: parcellation?.id,
        })
      })
    ),
    shareReplay(1),
  )

  onATPDebounceUpdateBaseLayers$ = createEffect(() => concat(
    of([] as atlasAppearance.const.NgLayerCustomLayer[]),
    this.onATPDebounceNgLayers$.pipe(
      switchMap(ngLayers => {
        const { parcNgLayers, tmplAuxNgLayers, tmplNgLayers, sxplrAnnotations } = ngLayers
        
        const customBaseLayers: atlasAppearance.const.NgLayerCustomLayer[] = []

        // order matters. first append tmplNgLayers, then tmpl auxnglayers, then parc layers
        for (const layers of [tmplNgLayers, tmplAuxNgLayers, parcNgLayers]) {
          for (const key in layers) {
            const v = layers[key]

            if (v.legacySpecFlag === "old") {
              customBaseLayers.push({
                clType: "baselayer/nglayer",
                legacySpecFlag: "old",
                id: key,
                sxplrAnnotations,
                ...v
              })
            }

            if (v.legacySpecFlag === "new") {
              customBaseLayers.push({
                legacySpecFlag: "new",
                clType: "baselayer/nglayer",
                id: key,
                sxplrAnnotations,
                ...v
              })
            }

          }
        }
        return of(customBaseLayers)
      })
    )
  ).pipe(
    pairwise(),
    switchMap(([oLayers, nLayers]) => {
      return of(
        atlasAppearance.actions.removeCustomLayers({
          customLayers: oLayers
        }),
        atlasAppearance.actions.addCustomLayers({
          customLayers: nLayers
        })
      )
    })
  ))

  constructor(
    private store: Store<any>,
    private sapi: SAPI,
  ){}
}