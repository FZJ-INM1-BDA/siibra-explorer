import { Pipe, PipeTransform } from "@angular/core";
import { IAnnotationGeometry } from "./tools/type";

@Pipe({
  name: 'filterAnnotationsBySpace',
  pure: true
})

export class FilterAnnotationsBySpace implements PipeTransform{
  public transform(annotations: IAnnotationGeometry[], space: { '@id': string }): IAnnotationGeometry[]{
    return annotations.filter(ann => ann.space["@id"] === space["@id"])
  }
}