import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import { CookieAgreement } from "./cookieAgreement/cookieAgreement.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    ComponentsModule,
  ],
  declarations: [
    CookieAgreement,
  ],
  exports: [
    CookieAgreement
  ]
})

export class CookieModule{}