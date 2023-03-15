import { Directive, Inject, TemplateRef } from "@angular/core";

@Directive({
  selector: `ng-template[sxplrSmartChipHeader]`
})

export class SmartChipHeader {
  constructor(@Inject(TemplateRef) public templateRef: TemplateRef<unknown>){}
}
