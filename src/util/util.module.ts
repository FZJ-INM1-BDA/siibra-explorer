import { NgModule } from "@angular/core";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";
import { DelayEventDirective } from "./directives/delayEvent.directive";
import { KeyListner } from "./directives/keyDownListener.directive";

import { StopPropagationDirective } from "./directives/stopPropagation.directive";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { IncludesPipe } from "./pipes/includes.pipe";
import { SafeResourcePipe } from "./pipes/safeResource.pipe";
import { CaptureClickListenerDirective } from "./directives/captureClickListener.directive";
import { AddUnitAndJoin } from "./pipes/addUnitAndJoin.pipe";
import { NmToMm } from "./pipes/numbers.pipe";
import { SwitchDirective } from "./directives/switch.directive";
import { MediaQueryDirective } from './directives/mediaQuery.directive'
import { LayoutModule } from "@angular/cdk/layout";
import { MapToPropertyPipe } from "./pipes/mapToProperty.pipe";
import {ClickOutsideDirective} from "src/util/directives/clickOutside.directive";
import { CounterDirective } from "./directives/counter.directive";
import { GetNthElementPipe } from "./pipes/getNthElement.pipe";
import { ParseAsNumberPipe } from "./pipes/parseAsNumber.pipe";

@NgModule({
  imports:[
    LayoutModule
  ],
  declarations: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective,
    DelayEventDirective,
    KeyListner,
    IncludesPipe,
    SafeResourcePipe,
    CaptureClickListenerDirective,
    AddUnitAndJoin,
    NmToMm,
    SwitchDirective,
    MediaQueryDirective,
    MapToPropertyPipe,
    ClickOutsideDirective,
    CounterDirective,
    GetNthElementPipe,
    ParseAsNumberPipe,
  ],
  exports: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe,
    StopPropagationDirective,
    DelayEventDirective,
    KeyListner,
    IncludesPipe,
    SafeResourcePipe,
    CaptureClickListenerDirective,
    AddUnitAndJoin,
    NmToMm,
    SwitchDirective,
    MediaQueryDirective,
    MapToPropertyPipe,
    ClickOutsideDirective,
    CounterDirective,
    GetNthElementPipe,
    ParseAsNumberPipe,
  ]
})

export class UtilModule {

}
