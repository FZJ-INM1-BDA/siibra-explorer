import { CommonModule } from "@angular/common";
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SpinnerModule } from "src/components/spinner";
import { AngularMaterialModule } from "src/sharedModules";
import { APPEND_SCRIPT_TOKEN } from "src/util/constants";
import { ZipFilesOutputModule } from "src/zipFilesOutput/module";
import { Autoradiography } from "./autoradiography/autoradiography.component";
import { Entry } from "./entry/entry.component";
import { Fingerprint } from "./fingerprint/fingerprint.component"
import { Profile } from "./profile/profile.component"

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    BrowserAnimationsModule,
    SpinnerModule,
    ZipFilesOutputModule,
  ],
  declarations: [
    Autoradiography,
    Fingerprint,
    Profile,
    Entry,
  ],
  exports: [
    Autoradiography,
    Fingerprint,
    Profile,
    Entry,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})

export class ReceptorViewModule{}
