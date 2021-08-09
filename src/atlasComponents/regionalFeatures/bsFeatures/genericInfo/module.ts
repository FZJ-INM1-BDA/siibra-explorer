import { CommonModule } from "@angular/common";
import { Component, Inject, NgModule, Optional } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { IAV_DATASET_SHOW_DATASET_DIALOG_CMP } from "../kgDataset/showDataset/showDataset.directive";
import { GenericInfoCmp } from "./genericInfoCmp/genericInfo.component";

@Component({
  selector: 'show-ds-dialog-cmp',
  template: `
<ng-template [ngIf]="useClassicUi" [ngIfElse]="modernUiTmpl">
  <generic-info-cmp></generic-info-cmp>
</ng-template>

<ng-template #modernUiTmpl>

  <mat-dialog-content class="m-0 p-0">
    <generic-info-cmp></generic-info-cmp>
  </mat-dialog-content>

  <mat-dialog-actions align="center">
    <button mat-button mat-dialog-close>
      Close
    </button>
  </mat-dialog-actions>

</ng-template>
`
})

export class ShowDsDialogCmp{
  public useClassicUi = false
  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data: any
  ){
    this.useClassicUi = data.useClassicUi
  }
}

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    ComponentsModule,
  ],
  declarations: [
    GenericInfoCmp,
    ShowDsDialogCmp,
  ],
  exports: [
    GenericInfoCmp,
  ],

  providers: [
    {
      provide: IAV_DATASET_SHOW_DATASET_DIALOG_CMP,
      useValue: ShowDsDialogCmp
    }
  ]
})

export class GenericInfoModule{}
