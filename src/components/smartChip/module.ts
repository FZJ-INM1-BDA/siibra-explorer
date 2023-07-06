import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatRippleModule } from "@angular/material/core";
import { MatMenuModule } from "@angular/material/menu";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SmartChip } from "./component/smartChip.component";
import { HasSubMenuPipe } from "./hasSubmenu.pipe";
import { SmartChipContent } from "./smartChip.content.directive";
import { SmartChipHeader } from "./smartChip.header.directive";
import { SmartChipMenu } from "./smartChip.menu.directive";
import { ExperimentalModule } from "src/experimental/experimental.module";

@NgModule({
  imports: [
    CommonModule,
    MatMenuModule,
    BrowserAnimationsModule,
    MatRippleModule,
    ExperimentalModule,
  ],
  declarations: [
    SmartChipMenu,
    SmartChipContent,
    SmartChipHeader,
    SmartChip,
    HasSubMenuPipe,
  ],
  exports: [
    SmartChipMenu,
    SmartChipContent,
    SmartChipHeader,
    SmartChip,
  ]
})

export class SmartChipModule{}
