import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LayoutModule } from "src/layouts/layout.module";
import { AngularMaterialModule } from "src/sharedModules";
import { ConfigComponent } from "./configCmp/config.component";
import { ReactiveFormsModule } from "@angular/forms";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    LayoutModule,
    ReactiveFormsModule,
    ExperimentalFlagDirective,
  ],
  declarations: [
    ConfigComponent,
  ],
  exports: [
    ConfigComponent,
  ]
})
export class ConfigModule{}
