import { Directive, Inject, TemplateRef } from "@angular/core";

@Directive({
  selector: `ng-template[sxplrSmartChipMenu]`
})

export class SmartChipMenu {
  constructor(@Inject(TemplateRef) public templateRef: TemplateRef<unknown>){}  
}
