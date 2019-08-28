import {
  MatButtonModule,
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
  MatSliderModule
  
} from '@angular/material';
import { NgModule } from '@angular/core';

/**
 * TODO should probably be in src/util
 */

@NgModule({
  imports: [
    MatButtonModule,
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
    MatSliderModule
  ],
  exports: [
    MatButtonModule,
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
    MatSliderModule
  ],
})
export class AngularMaterialModule { }