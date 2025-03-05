import { NgModule } from "@angular/core";
import { KeyListner } from "./directives/keyDownListener.directive";
import { StopPropagationDirective } from "./directives/stopPropagation.directive";
import { SafeResourcePipe } from "./pipes/safeResource.pipe";
import { CaptureClickListenerDirective } from "./directives/captureClickListener.directive";
import { NmToMm } from "./pipes/nmToMm.pipe";
import { SwitchDirective } from "./directives/switch.directive";
import { LayoutModule } from "@angular/cdk/layout";
import { MapToPropertyPipe } from "./pipes/mapToProperty.pipe";
import { ClickOutsideDirective } from "src/util/directives/clickOutside.directive";
import { GetNthElementPipe } from "./pipes/getNthElement.pipe";
import { ParseAsNumberPipe } from "./pipes/parseAsNumber.pipe";
import { GetUniquePipe } from "./pipes/getUnique.pipe";
import { GetPropertyPipe } from "./pipes/getProperty.pipe";
import { FilterArrayPipe } from "./pipes/filterArray.pipe";
import { DoiParserPipe } from "./pipes/doiPipe.pipe";
import { GetFilenamePipe } from "./pipes/getFilename.pipe";
import { CombineFnPipe } from "./pipes/combineFn.pipe";
import { MergeObjPipe } from "./mergeObj.pipe";
import { IncludesPipe } from "./includes.pipe";
import { SidePanelComponent } from './side-panel/side-panel.component';
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'
import { CommonModule } from "@angular/common";
import { DfToDsPipe } from './df-to-ds.pipe';
import { PrettyPresentPipe } from './pretty-present.pipe';
import { DedupPipe } from "./pipes/dedup.pipe";
import { IsLocalBlob as IsLocalBlobPipe } from "./pipes/isLocalBlob.pipe";
import { ConcatPipe } from "./pipes/concat.pipe";

@NgModule({
  imports:[
    LayoutModule,
    AngularMaterialModule,
    CommonModule,
  ],
  declarations: [
    StopPropagationDirective,
    KeyListner,
    SafeResourcePipe,
    CaptureClickListenerDirective,
    NmToMm,
    SwitchDirective,
    MapToPropertyPipe,
    ClickOutsideDirective,
    GetNthElementPipe,
    ParseAsNumberPipe,
    GetUniquePipe,
    GetPropertyPipe,
    FilterArrayPipe,
    DoiParserPipe,
    GetFilenamePipe,
    CombineFnPipe,
    MergeObjPipe,
    IncludesPipe,
    SidePanelComponent,
    DfToDsPipe,
    PrettyPresentPipe,
    DedupPipe,
    IsLocalBlobPipe,
    ConcatPipe,
  ],
  exports: [
    StopPropagationDirective,
    KeyListner,
    SafeResourcePipe,
    CaptureClickListenerDirective,
    NmToMm,
    SwitchDirective,
    MapToPropertyPipe,
    ClickOutsideDirective,
    GetNthElementPipe,
    ParseAsNumberPipe,
    GetUniquePipe,
    GetPropertyPipe,
    FilterArrayPipe,
    DoiParserPipe,
    GetFilenamePipe,
    CombineFnPipe,
    MergeObjPipe,
    IncludesPipe,
    SidePanelComponent,
    DfToDsPipe,
    PrettyPresentPipe,
    DedupPipe,
    IsLocalBlobPipe,
    ConcatPipe,
  ]
})

export class UtilModule {

}
