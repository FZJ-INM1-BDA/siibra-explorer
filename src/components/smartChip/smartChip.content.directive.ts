import { Directive, Inject, TemplateRef } from "@angular/core";

@Directive({
  selector: `ng-template[sxplrSmartChipContent]`
})

export class SmartChipContent {
  constructor(@Inject(TemplateRef) public templateRef: TemplateRef<unknown>){}  
}
