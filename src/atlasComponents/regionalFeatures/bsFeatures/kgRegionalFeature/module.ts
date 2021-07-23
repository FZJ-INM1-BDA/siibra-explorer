import { CommonModule } from "@angular/common";
import { Component, NgModule } from "@angular/core";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { KgRegSummaryCmp } from "./kgRegSummary/kgRegSummary.component";
import { KgRegionalFeaturesList } from "./kgRegList/kgRegList.component";
import { KgRegionalFeaturesListDirective } from "./kgRegList/kgReglist.directive";
import { KgRegDetailCmp } from "./kgRegDetail/kgRegDetail.component";
import { KgDatasetModule } from "../kgDataset";
import { IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "../kgDataset/showDataset/showDataset.directive";
import { UtilModule } from "src/util";
import { ComponentsModule } from "src/components";
import { BsFeatureService } from "../service";

@Component({
  selector: 'blabla',
  template: `
<mat-dialog-content class="m-0 p-0">
  <kg-regional-feature-detail></kg-regional-feature-detail>
</mat-dialog-content>

<mat-dialog-actions align="center">
  <button mat-button mat-dialog-close>
    Close
  </button>
</mat-dialog-actions>
`
})

export class ShowDsDialogCmp{}

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    KgDatasetModule,
    UtilModule,
    ComponentsModule,
  ],
  declarations:[
    KgRegSummaryCmp,
    KgRegionalFeaturesList,
    KgRegionalFeaturesListDirective,
    KgRegDetailCmp,
    ShowDsDialogCmp,
  ],
  exports:[
    KgRegSummaryCmp,
    KgRegionalFeaturesList,
    KgRegionalFeaturesListDirective,
    KgRegDetailCmp,
  ],
  providers: [
    {
      provide: IAV_DATASET_SHOW_DATASET_DIALOG_CMP,
      useValue: ShowDsDialogCmp
    }
  ]
})

export class KgRegionalFeatureModule{
  constructor(svc: BsFeatureService){
    svc.registerFeature({
      name: 'EBRAINS datasets',
      icon: 'fas fa-ellipsis-h',
      View: KgRegionalFeaturesList,
      Ctrl: KgRegionalFeaturesListDirective,
    })
  }
}
