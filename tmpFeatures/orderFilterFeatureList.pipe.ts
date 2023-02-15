import { Pipe, PipeTransform } from "@angular/core";
import { CLEANED_IEEG_DATASET_TYPE, SapiFeatureModel, SxplrCleanedFeatureModel } from "src/atlasComponents/sapi/type";
import { environment } from "src/environments/environment"

type PipableFeatureType = SapiFeatureModel | SxplrCleanedFeatureModel

type ArrayOperation<T extends boolean | number> = (input: PipableFeatureType) => T

const FILTER_FN: ArrayOperation<boolean> = feature => {
  return feature["@type"] !== "siibra/features/cells"
}

const ORDER_LIST: ArrayOperation<number> = feature => {
  if (feature["@type"] === "siibra/features/receptor") return -4
  if (feature["@type"] === CLEANED_IEEG_DATASET_TYPE) return -3
  if (feature['@type'] === "https://openminds.ebrains.eu/core/DatasetVersion") return 2
  return 0
}

@Pipe({
  name: 'orderFilterFeatures',
  pure: true
})

export class OrderFilterFeaturesPipe implements PipeTransform{
  public transform(inputFeatures: PipableFeatureType[]): PipableFeatureType[] {
    return inputFeatures
      .filter(f => {
        /**
         * if experimental flag is set, do not filter out anything
         */
        if (environment.EXPERIMENTAL_FEATURE_FLAG) return true
        return FILTER_FN(f)
      })
      .sort((a, b) => ORDER_LIST(a) - ORDER_LIST(b))
  }
}
