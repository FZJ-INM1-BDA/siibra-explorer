import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { SxplrParcellation, SxplrRegion, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

export type BBox = [[number, number, number], [number, number, number]]

export type TPRB = {
  template?: SxplrTemplate
  parcellation?: SxplrParcellation
  region?: SxplrRegion
  bbox?: BBox
}

export type FeatureConcept = {
  register: (id: string, concept: TPRB) => void
  concept$: Observable<{ id: string, concept: TPRB }>
}

export const FEATURE_CONCEPT_TOKEN = new InjectionToken("FEATURE_CONCEPT_TOKEN")
