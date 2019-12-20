import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name : 'getLayerNameFromDatasets',
})

export class GetLayerNameFromDatasets implements PipeTransform {
  public transform(ngLayerName: string, datasets?: any[]): string {
    if (!datasets) {
      return ngLayerName
    }

    const foundDataset = datasets.find(ds => ds.files.findIndex(file => file.url === ngLayerName) >= 0)

    return foundDataset
      ? foundDataset.name
      : ngLayerName
  }
}
