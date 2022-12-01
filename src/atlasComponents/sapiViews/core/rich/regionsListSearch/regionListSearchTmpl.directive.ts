import { Directive, TemplateRef } from "@angular/core";
import { SapiRegionModel } from "src/atlasComponents/sapi/type";

@Directive({
  selector: 'ng-template[region-template],ng-template[regionTemplate]'
})

export class SapiViewsCoreRichRegionListTemplateDirective{
  constructor(public tmplRef: TemplateRef<SapiRegionModel>){}
}
