import { Pipe, PipeTransform } from "@angular/core";
import { IAnnotationGeometry, TExportFormats } from "./type";

@Pipe({
  name: 'toFormattedStringPipe',
  pure: true
})

export class ToFormattedStringPipe implements PipeTransform{

  public transform(_: any, annotation: IAnnotationGeometry, format: TExportFormats){
    if (format === 'json') {
      return JSON.stringify(annotation.toJSON(), null, 2)
    }

    if (format === 'sands') {
      return JSON.stringify(annotation.toSands(), null, 2)
    }

    return annotation.toString()
  }
}
