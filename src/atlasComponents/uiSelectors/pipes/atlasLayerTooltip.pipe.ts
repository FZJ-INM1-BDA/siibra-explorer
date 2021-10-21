import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'atlasLayerTooltip',
  pure: true
})

export class AtlaslayerTooltipPipe implements PipeTransform{
  public transform(layer: any){
    return layer.name
  }
}
