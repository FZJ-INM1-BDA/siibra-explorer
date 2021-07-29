import { Pipe, PipeTransform } from "@angular/core";
import { IBSSummaryResponse, TContextedFeature } from "../type";
import {
  IEEG_FEATURE_NAME
} from '../ieeg'
import {
  RECEPTOR_FEATURE_NAME
} from '../receptor'
import {
  EbrainsRegionalFeatureName
} from '../kgRegionalFeature'

@Pipe({
  name: 'renderRegionalFeatureSummaryPipe',
  pure: true,
})

export class RenderRegionalFeatureSummaryPipe implements PipeTransform{
  public transform(input: TContextedFeature<keyof IBSSummaryResponse>): string{
    if (input.featureName === IEEG_FEATURE_NAME) {
      return input.result['name']
    }
    if (input.featureName === RECEPTOR_FEATURE_NAME) {
      return input.result['name']
    }
    if (input.featureName === EbrainsRegionalFeatureName) {
      return input.result['src_name']
    }
    return `[Unknown feature type]`
  }
}
