import { Pipe, PipeTransform } from "@angular/core";
import { NgLayerInterface } from "src/atlasViewer/atlasViewer.component";

/**
 * TODO deprecate
 * use regular pipe to achieve the same effect
 */

@Pipe({
  name: 'filterNgLayer'
})

export class FilterNgLayer implements PipeTransform{
  public transform(excludedLayers: string[] = [], ngLayers: NgLayerInterface[]): NgLayerInterface[] {
    const set = new Set(excludedLayers)
    return ngLayers.filter(l => !set.has(l.name))
  }
}