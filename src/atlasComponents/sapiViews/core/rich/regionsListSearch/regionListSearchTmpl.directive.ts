import { Directive, TemplateRef } from "@angular/core";

@Directive({
  selector: 'ng-template[region-template],ng-template[regionTemplate]'
})

export class SapiViewsCoreRichRegionListTemplateDirective{
  constructor(public tmplRef: TemplateRef<unknown>){}
}
