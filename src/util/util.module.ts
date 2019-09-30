import { NgModule } from "@angular/core";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";
import { StopPropagationDirective } from "./directives/stopPropagation.directive";
import { DelayEventDirective } from "./directives/delayEvent.directive";

@NgModule({
  declarations: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective,
    DelayEventDirective
  ],
  exports: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective,
    DelayEventDirective
  ]
})

export class UtilModule{

}