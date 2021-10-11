import { NgModule } from "@angular/core";
import { SigninModal } from "./signinModal/signinModal.component";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "src/sharedModules";
import { AuthService } from "./auth.service";
import { AuthStateDdirective } from "./auth.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    SigninModal,
    AuthStateDdirective,
  ],
  exports: [
    SigninModal,
    AuthStateDdirective,
  ],
  providers: [
    AuthService,
  ]
})

export class AuthModule{}
