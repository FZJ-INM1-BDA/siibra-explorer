import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HoverableModule } from "../hoverable";
import { ReadmoreComponent } from "./readmoreCmp/readmore.component";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    HoverableModule,
  ],
  declarations: [
    ReadmoreComponent
  ],
  exports: [
    ReadmoreComponent
  ]
})

export class ReadmoreModule{}