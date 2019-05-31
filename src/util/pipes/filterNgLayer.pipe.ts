import { Pipe, PipeTransform } from "@angular/core";
import { NgLayerInterface } from "src/atlasViewer/atlasViewer.component";

@Pipe({
  name: 'filterNgLayer'
})

export class FilterNgLayer implements PipeTransform{
  public transform(excludedLayers: string[] = [], ngLayers: NgLayerInterface[]): NgLayerInterface[] {
    const set = new Set(excludedLayers)
    return ngLayers.filter(l => !set.has(l.name))
  }
}