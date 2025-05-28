import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { ClipboardCopy } from "./clipboardCopy.directive";
import { HttpClientModule } from "@angular/common/http";
import { SaneUrl } from "./saneUrl/saneUrl.component";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { AuthModule } from "src/auth";
import { ShareSheetComponent } from "./shareSheet/shareSheet.component";
import { ShareDirective } from "./share.directive";
import { StateModule } from "src/state";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";

@NgModule({
  imports: [
    AngularMaterialModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthModule,
    StateModule,
    ExperimentalFlagDirective,
  ],
  declarations: [
    ClipboardCopy,
    SaneUrl,
    ShareSheetComponent,
    ShareDirective,
  ],
  exports: [
    ClipboardCopy,
    SaneUrl,
    ShareSheetComponent,
    ShareDirective,
  ]
})

export class ShareModule{}
