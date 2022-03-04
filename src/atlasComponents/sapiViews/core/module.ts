import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SapiViewsCoreDatasetModule } from "./datasets";

@NgModule({
  imports: [
    CommonModule,
    SapiViewsCoreDatasetModule,
  ],
  exports: [
    SapiViewsCoreDatasetModule
  ]
})

export class SapiViewsCoreModule{}