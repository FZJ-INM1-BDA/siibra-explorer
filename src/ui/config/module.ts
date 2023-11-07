import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/sharedModules";
import { ConfigComponent } from "./configCmp/config.component";
import { ReactiveFormsModule } from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    LayoutModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ConfigComponent,
  ],
  exports: [
    ConfigComponent,
  ]
})
export class ConfigModule{}
