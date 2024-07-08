import { Pipe, PipeTransform } from "@angular/core";
import { CFIndex } from "./util"

@Pipe({
  name: 'indexToStr',
  pure: true
})
export class IndexToStrPipe implements PipeTransform{
  public transform(value: CFIndex['index']): string {
    if (typeof value === "string") {
      return value
    }
    return `Point(${value.loc.map(v => v.toFixed(2)).join(", ")})`
  }
}
