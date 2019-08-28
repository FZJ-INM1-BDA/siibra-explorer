import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'regionBackgroundToRgbPipe'
})

export class RegionBackgroundToRgbPipe implements PipeTransform{
  public transform(region = null): string{
    return region && region.rgb
      ? `rgb(${region.rgb.join(',')})`
      : 'white'
  }
}