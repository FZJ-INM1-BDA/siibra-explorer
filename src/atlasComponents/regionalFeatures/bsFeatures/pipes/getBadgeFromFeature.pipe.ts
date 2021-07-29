import { Pipe, PipeTransform } from "@angular/core";
import { IBSSummaryResponse, TContextedFeature } from "../type";
import {
  IEEG_FEATURE_NAME
} from '../ieeg'
import {
  RECEPTOR_FEATURE_NAME
} from '../receptor'

export type TBadge = {
  text: string
  color: 'primary' | 'warn' | 'accent'
}

@Pipe({
  name: 'getBadgeFromFeaturePipe',
  pure: true
})

export class GetBadgeFromFeaturePipe implements PipeTransform{
  public transform(input: TContextedFeature<keyof IBSSummaryResponse>): TBadge[]{
    if (input.featureName === IEEG_FEATURE_NAME) {
      return [{
        text: IEEG_FEATURE_NAME,
        color: 'primary',
      }]
    }
    if (input.featureName === RECEPTOR_FEATURE_NAME) {
      return [{
        text: RECEPTOR_FEATURE_NAME,
        color: 'accent',
      }]
    }
    return []
  }
}
