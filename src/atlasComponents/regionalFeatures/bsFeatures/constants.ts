import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { IHasId } from "src/util/interfaces";

export const BS_ENDPOINT = new InjectionToken<string>('BS_ENDPOINT')

export type TFeature = 'ReceptorDistribution'

export type TRegion = {
  name: string
  status?: string
  context: {
    atlas: IHasId
    template: IHasId
    parcellation: IHasId
  }
}

export const BS_DARKTHEME = new InjectionToken<Observable<boolean>>('BS_DARKTHEME')