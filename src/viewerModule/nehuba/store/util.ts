import { select } from "@ngrx/store";
import { forkJoin, of, pipe } from "rxjs";
import { switchMap, map, take, filter } from "rxjs/operators";
import { SAPI, SAPIParcellation, SapiParcellationModel, SAPISpace } from "src/atlasComponents/sapi";
import { atlasSelection } from "src/state";
import { getRegionLabelIndex } from "../config.service/util";

export type ParcVolumeSpec = {
  volumeSrc: string
  labelIndicies: number[]
  parcellation: SapiParcellationModel
  laterality: 'left hemisphere' | 'right hemisphere' | 'whole brain'
}

type NehubaRegionIdentifier = {
  source: string
  labelIndex: number
}

export const fromRootStore = {
  getAuxMeshVolumes: (sapi: SAPI) => pipe(
    select(atlasSelection.selectors.selectedTemplate),
    filter(template => !!template),
    switchMap(template => 
      sapi.registry.get<SAPISpace>(template["@id"])
        .getVolumes()
        .then(volumes => volumes.filter(vol => "neuroglancer/precompmesh" in vol.data.detail))
    ),
    take(1),
  ),
  getTmplVolumes: (sapi: SAPI) => pipe(
    select(atlasSelection.selectors.selectedTemplate),
    filter(template => !!template),
    switchMap(template => {
      return sapi.registry.get<SAPISpace>(template["@id"])
        .getVolumes()
        .then(volumes => volumes.filter(vol => "neuroglancer/precomputed" in vol.data.detail))
    }),
    take(1),
  ),
  getParcVolumes: (sapi: SAPI) => pipe(
    select(atlasSelection.selectors.selectedATP),
    filter(({ parcellation }) => !!parcellation),
    switchMap(({ atlas, template, parcellation }) => {
      return forkJoin([
        sapi.registry.get<SAPIParcellation>(parcellation["@id"])
          .getRegions(template["@id"])
          .then(regions => {
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
          }),
        sapi.registry.get<SAPIParcellation>(parcellation["@id"]).getVolumes()
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
    }),
    take(1),
  ),
}
