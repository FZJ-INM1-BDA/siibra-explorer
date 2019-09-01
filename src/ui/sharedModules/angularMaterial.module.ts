import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule, MatBadgeModule, MatDialogModule, MatChipsModule
} from '@angular/material';
import { NgModule } from '@angular/core';
import {DragDropModule} from "@angular/cdk/drag-drop";

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule, MatBadgeModule, MatDialogModule, DragDropModule, MatChipsModule],
  exports: [MatButtonModule, MatCheckboxModule, MatSidenavModule, MatCardModule, MatTabsModule, MatTooltipModule, MatBadgeModule, MatDialogModule, DragDropModule, MatChipsModule],
})
export class AngularMaterialModule { }
