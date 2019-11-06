import { NgModule } from "@angular/core";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";
import { StopPropagationDirective } from "./directives/stopPropagation.directive";
import { DelayEventDirective } from "./directives/delayEvent.directive";
import { MouseHoverDirective, MouseOverTextPipe, MouseOverIconPipe } from "./directives/mouseOver.directive";
import { KeyListner } from "./directives/keyDownListener.directive";
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
    IncludesPipe
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
    IncludesPipe
  ]
})

export class UtilModule{

}