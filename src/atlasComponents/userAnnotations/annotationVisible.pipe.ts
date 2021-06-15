import { Pipe, PipeTransform } from "@angular/core";
import { IAnnotationGeometry } from "./tools/type";

@Pipe({
  name: 'annotationVisiblePipe',
  pure: true
})

export class AnnotationVisiblePipe implements PipeTransform{
  public transform(hiddenAnns: IAnnotationGeometry[], thisAnn: IAnnotationGeometry): boolean {
    return hiddenAnns.findIndex(a => a.id === thisAnn.id) < 0
  }
}
