import { NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/sharedModules";
import { ClipboardCopy } from "./clipboardCopy.directive";
import { HttpClientModule } from "@angular/common/http";
import { SaneUrl } from "./saneUrl/saneUrl.component";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { AuthModule } from "src/auth";

@NgModule({
  imports: [
    AngularMaterialModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthModule,
  ],
  declarations: [
    ClipboardCopy,
    SaneUrl,
  ],
  exports: [
    ClipboardCopy,
    SaneUrl,
  ]
})

export class ShareModule{}
