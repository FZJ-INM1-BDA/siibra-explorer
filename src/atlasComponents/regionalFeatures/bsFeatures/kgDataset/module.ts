import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ShowDatasetDialogDirective } from "./showDataset/showDataset.directive";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { GetTrailingHexPipe } from "./getTrailingHex.pipe";
import { ModalityPicker, SortModalityAlphabeticallyPipe } from "./modalityPicker/modalityPicker.component";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    ShowDatasetDialogDirective,
    GetTrailingHexPipe,
    ModalityPicker,
    SortModalityAlphabeticallyPipe,
  ],
  exports: [
    ShowDatasetDialogDirective,
    GetTrailingHexPipe,
    ModalityPicker,
  ]
})

export class KgDatasetModule{}
