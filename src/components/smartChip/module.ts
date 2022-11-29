import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatRippleModule } from "@angular/material/core";
import { MatMenuModule } from "@angular/material/menu";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SmartChip } from "./component/smartChip.component";
import { HasSubMenuPipe } from "./hasSubmenu.pipe";
import { SmartChipContent } from "./smartChip.content.directive";
import { SmartChipMenu } from "./smartChip.menu.directive";

@NgModule({
  imports: [
    CommonModule,
    MatMenuModule,
    BrowserAnimationsModule,
    MatRippleModule,
  ],
  declarations: [
    SmartChipMenu,
    SmartChipContent,
    SmartChip,
    HasSubMenuPipe,
  ],
  exports: [
    SmartChipMenu,
    SmartChipContent,
    SmartChip,
  ]
})

export class SmartChipModule{}
