import { NgModule } from "@angular/core";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";
import { DelayEventDirective } from "./directives/delayEvent.directive";
import { KeyListner } from "./directives/keyDownListener.directive";
import { MouseHoverDirective, MouseOverIconPipe, MouseOverTextPipe } from "./directives/mouseOver.directive";
import { StopPropagationDirective } from "./directives/stopPropagation.directive";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { IncludesPipe } from "./pipes/includes.pipe";
import { SafeResourcePipe } from "./pipes/safeResource.pipe";
import { CaptureClickListenerDirective } from "./directives/captureClickListener.directive";
import { AddUnitAndJoin } from "./pipes/addUnitAndJoin.pipe";
import { NmToMm } from "./pipes/numbers.pipe";
import { SwitchDirective } from "./directives/switch.directive";

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
    SafeResourcePipe,
    CaptureClickListenerDirective,
    AddUnitAndJoin,
    NmToMm,
    SwitchDirective,
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
    SafeResourcePipe,
    CaptureClickListenerDirective,
    AddUnitAndJoin,
    NmToMm,
    SwitchDirective,
  ]
})

export class UtilModule {

}
