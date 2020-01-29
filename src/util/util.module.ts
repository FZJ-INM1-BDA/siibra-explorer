import { NgModule } from "@angular/core";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";
import { DelayEventDirective } from "./directives/delayEvent.directive";
import { KeyListner } from "./directives/keyDownListener.directive";
import { MouseHoverDirective, MouseOverIconPipe, MouseOverTextPipe } from "./directives/mouseOver.directive";
import { StopPropagationDirective } from "./directives/stopPropagation.directive";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { IncludesPipe } from "./pipes/includes.pipe";

@NgModule({
  declarations: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective,
    DelayEventDirective,
    MouseHoverDirective,
    MouseOverTextPipe,
    MouseOverIconPipe,
    KeyListner,
    IncludesPipe,
  ],
  exports: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective,
    DelayEventDirective,
    MouseHoverDirective,
    MouseOverTextPipe,
    MouseOverIconPipe,
    KeyListner,
    IncludesPipe,
  ],
})

export class UtilModule {

}
