import { Pipe, PipeTransform } from "@angular/core";
import { Qualification } from "src/atlasComponents/sapi/typeV3"

const QUALIFICATION_TRANSLATION: Record<Qualification, string> = {
  APPROXIMATE: "is approximately",
  CONTAINED: "is contained by",
  CONTAINS: "contains",
  EXACT: "is exactly",
  HOMOLOGOUS: "is homologuous to",
  OTHER_VERSION: "is another version of",
  OVERLAPS: "overlaps with",
}

@Pipe({
  name: "translateQualificationPipe",
  pure: true
})
export class TranslateQualificationPipe implements PipeTransform{
  public transform(value: Qualification): string {
    return QUALIFICATION_TRANSLATION[value]
  }
}
