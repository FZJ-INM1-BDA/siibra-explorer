import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Autoradiography } from "./autoradiography/autoradiography.component";
import { Fingerprint } from "./fingerprint/fingerprint.component"
import { Profile } from "./profile/profile.component"

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    Autoradiography,
    Fingerprint,
    Profile,
  ],
  exports: [
    Autoradiography,
    Fingerprint,
    Profile,
  ]
})

export class ReceptorViewModule{}
