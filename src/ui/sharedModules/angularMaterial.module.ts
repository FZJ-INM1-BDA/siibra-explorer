import {
  MatButtonModule,
  MatCheckboxModule,
  MatSidenavModule,
  MatCardModule,
  MatTabsModule,
  MatTooltipModule,
  MatSnackBarModule,
  MatBadgeModule,
  MatDividerModule,
  MatSelectModule,
  MatChipsModule,
  MatAutocompleteModule,
  MatDialogModule,
  MatInputModule,
  MatBottomSheetModule,
  MatListModule,
  MatSlideToggleModule,
  MatRippleModule,
  MatSliderModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatMenuModule,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MatDialogConfig
} from '@angular/material';
import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling'

import { NgModule } from '@angular/core';
import {DragDropModule} from "@angular/cdk/drag-drop";


const defaultDialogOption: MatDialogConfig = new MatDialogConfig()

@NgModule({
  imports: [
    MatButtonModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatCardModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatInputModule,
    MatBottomSheetModule,
    MatListModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatSliderModule,
    DragDropModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatMenuModule,
    ExperimentalScrollingModule
  ],
  exports: [
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatCardModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatInputModule,
    MatBottomSheetModule,
    MatListModule,
    MatSlideToggleModule,
    MatRippleModule,
    MatSliderModule,
    DragDropModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatMenuModule,
    ExperimentalScrollingModule
  ],
  providers: [{
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: {
      ...defaultDialogOption,
      panelClass: 'iav-dialog-class'
    }
  }]
})
export class AngularMaterialModule { }
