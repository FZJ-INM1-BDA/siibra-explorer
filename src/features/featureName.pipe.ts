import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'featureNamePipe',
  pure: true,
})

export class FeatureNamePipe implements PipeTransform{
  public transform(name: string): string {
    return name.split(".").slice(-1)[0]
  }
}
