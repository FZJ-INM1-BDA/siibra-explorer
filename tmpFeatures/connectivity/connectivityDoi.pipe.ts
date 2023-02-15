import { Pipe, PipeTransform } from "@angular/core"
import { SapiParcellationFeatureModel } from "src/atlasComponents/sapi/type"

@Pipe({
    name: 'connectivityDoiPipe',
    pure: true
  })
  
  export class ConnectivityDoiPipe implements PipeTransform {
    public transform(dataset: SapiParcellationFeatureModel): string[] {
      const url = `https://search.kg.ebrains.eu/instances/${dataset['dataset_id']}`
      return [url]
    }
  }
  