import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SmartChip } from "./component/smartChip.component";
import { HasSubMenuPipe } from "./hasSubmenu.pipe";
import { SmartChipContent } from "./smartChip.content.directive";
import { SmartChipHeader } from "./smartChip.header.directive";
import { SmartChipMenu } from "./smartChip.menu.directive";
import { ExperimentalModule } from "src/experimental/experimental.module";
import { SmartChipAction } from "./smartChip.action.directive";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ExperimentalModule,
    AngularMaterialModule,
  ],
  declarations: [
    SmartChipMenu,
    SmartChipContent,
    SmartChipHeader,
    SmartChipAction,
    SmartChip,
    HasSubMenuPipe,
  ],
  exports: [
    SmartChipMenu,
    SmartChipContent,
    SmartChipHeader,
    SmartChipAction,
    SmartChip,
  ]
})

export class SmartChipModule{}
