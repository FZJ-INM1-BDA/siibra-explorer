import { NgModule } from "@angular/core";
import { CompoundFtContainer } from "./compoundFtContainer.component";
import { AngularMaterialModule } from "src/sharedModules";
import { CommonModule } from "@angular/common";
import { IndexToStrPipe } from "./indexToText.pipe";

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
  ],
  declarations: [
    CompoundFtContainer,
    IndexToStrPipe,
  ],
  exports: [
    CompoundFtContainer
  ]
})
export class CompoundFeatureModule{}
