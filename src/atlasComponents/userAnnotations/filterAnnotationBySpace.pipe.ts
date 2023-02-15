import { Pipe, PipeTransform } from "@angular/core";
import { IAnnotationGeometry } from "./tools/type";
import { SxplrTemplate } from "src/atlasComponents/sapi/type_sxplr"

type TOpts = {
  reverse?: boolean
}

@Pipe({
  name: 'filterAnnotationsBySpace',
  pure: true
})

export class FilterAnnotationsBySpace implements PipeTransform{
  public transform(annotations: IAnnotationGeometry[], space: SxplrTemplate, opts?: TOpts): IAnnotationGeometry[]{
    const { reverse = false } = opts || {}
    return reverse
      ? annotations.filter(ann => ann.space?.id !== space?.id)
      : annotations.filter(ann => ann.space?.id === space?.id)
  }
}
