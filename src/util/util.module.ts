import { NgModule } from "@angular/core";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";
import { StopPropagationDirective } from "./directives/stopPropagation.directive";

@NgModule({
  declarations: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective
  ],
  exports: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective
  ]
})

export class UtilModule{

}