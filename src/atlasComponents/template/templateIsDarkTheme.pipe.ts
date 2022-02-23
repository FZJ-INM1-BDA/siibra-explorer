import { Pipe, PipeTransform } from "@angular/core";
import { IHasId } from "src/util/interfaces";

@Pipe({
  name: 'templateIsDarkTheme',
  pure: true,
})

export class TemplateIsDarkThemePipe implements PipeTransform{

  public transform(template: IHasId): boolean{
    return template["@id"] !== "minds/core/referencespace/v1.0.0/a1655b99-82f1-420f-a3c2-fe80fd4c8588"
  }
}