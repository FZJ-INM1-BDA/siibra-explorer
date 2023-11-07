import { Directive, Inject, TemplateRef } from "@angular/core";

@Directive({
  selector: `ng-template[sxplrSmartChipAction]`
})

export class SmartChipAction {
  constructor(@Inject(TemplateRef) public templateRef: TemplateRef<unknown>){}
}
