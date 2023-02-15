import { Directive, TemplateRef } from "@angular/core";
import { SxplrRegion } from "src/atlasComponents/sapi/type_sxplr";

@Directive({
  selector: 'ng-template[region-template],ng-template[regionTemplate]'
})

export class SapiViewsCoreRichRegionListTemplateDirective{
  constructor(public tmplRef: TemplateRef<SxplrRegion>){}
}
