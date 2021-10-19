import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AngularMaterialModule } from "src/sharedModules";
import { ReadmoreComponent } from "./readmoreCmp/readmore.component";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
  ],
  declarations: [
    ReadmoreComponent
  ],
  exports: [
    ReadmoreComponent
  ]
})

export class ReadmoreModule{}