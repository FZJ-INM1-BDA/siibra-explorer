import { CommonModule, DOCUMENT } from "@angular/common"
import { NgModule } from "@angular/core"
import { AngularMaterialModule } from "src/sharedModules"
import { appendScriptFactory, APPEND_SCRIPT_TOKEN } from "src/util/constants"
import { FeatureEntryCmp } from "./entry/entry.component"
import { SapiViewsFeaturesEntryListItem } from "./entryListItem/entryListItem.component"
import { FeatureBadgeColourPipe } from "./featureBadgeColor.pipe"
import { FeatureBadgeNamePipe } from "./featureBadgeName.pipe"
import * as ieeg from "./ieeg"
import * as receptor from "./receptors"

const {
  IEEGSessionCmp
} = ieeg
const {
  ReceptorViewModule
} = receptor

@NgModule({
  imports: [
    CommonModule,
    ReceptorViewModule,
    AngularMaterialModule,
  ],
  declarations: [
    IEEGSessionCmp,
    FeatureEntryCmp,
    FeatureBadgeNamePipe,
    FeatureBadgeColourPipe,
    SapiViewsFeaturesEntryListItem,
  ],
  providers: [
    {
      provide: APPEND_SCRIPT_TOKEN,
      useFactory: appendScriptFactory,
      deps: [ DOCUMENT ]
    }
  ],
  exports: [
    IEEGSessionCmp,
    FeatureEntryCmp,
    SapiViewsFeaturesEntryListItem,
  ]
})
export class SapiViewsFeaturesModule{}