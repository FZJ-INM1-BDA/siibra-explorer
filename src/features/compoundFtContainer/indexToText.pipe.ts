import { Pipe, PipeTransform } from "@angular/core";
import { SimpleCompoundFeature } from "src/atlasComponents/sapi/sxplrTypes";

@Pipe({
  name: 'indexToStr',
  pure: true
})
export class IndexToStrPipe implements PipeTransform{
  public transform(value: SimpleCompoundFeature['indices'][number]['index']): string {
    if (typeof value === "string") {
      return value
    }
    return `Point(${value.loc.join(", ")})`
  }
}
