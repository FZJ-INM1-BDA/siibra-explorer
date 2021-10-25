import { IHasId } from "src/util/interfaces";
import { TRegionSummary } from "src/util/siibraApiConstants/types";

type TAny = {
  [key: string]: any
}

export type TSiibraExTemplate = IHasId & TAny
export type TSiibraExParcelation = IHasId & TAny

export type TSiibraExAtlas = {
  name: string
  '@id': string
  parcellations: TSiibraExParcelation[]
  templateSpaces: TSiibraExTemplate[]
}

export type TSiibraExRegion = TRegionSummary & {
  context: {
    atlas: TSiibraExAtlas
    template: TSiibraExTemplate
    parcellation: TSiibraExParcelation
  }
}
