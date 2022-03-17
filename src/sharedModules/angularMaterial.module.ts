import {MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig, MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatCardModule} from "@angular/material/card";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatTabsModule} from "@angular/material/tabs";
import {MatSidenavModule} from "@angular/material/sidenav";
import {NgModule} from "@angular/core";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatBadgeModule} from "@angular/material/badge";
import {MatDividerModule} from "@angular/material/divider";
import {MatSelectModule} from "@angular/material/select";
import {MatChipsModule} from "@angular/material/chips";
import {MatAutocompleteModule} from "@angular/material/autocomplete";

import { ScrollingModule } from '@angular/cdk/scrolling'
import {MatInputModule} from "@angular/material/input";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatListModule} from "@angular/material/list";
import {MatBottomSheetModule} from "@angular/material/bottom-sheet";
import {MatRippleModule} from "@angular/material/core";
import {MatSliderModule} from "@angular/material/slider";
import {DragDropModule} from "@angular/cdk/drag-drop";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatIconModule} from "@angular/material/icon";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatMenuModule} from "@angular/material/menu";
import { MatToolbarModule } from '@angular/material/toolbar'

import { ClipboardModule } from '@angular/cdk/clipboard'
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

const defaultDialogOption: MatDialogConfig = new MatDialogConfig()

@NgModule({
  imports: [
    BrowserAnimationsModule,
    
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
    ScrollingModule,
    MatToolbarModule,
    ClipboardModule,
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
    ScrollingModule,
    MatToolbarModule,
    ClipboardModule,
  ],
  providers: [{
    provide: MAT_DIALOG_DEFAULT_OPTIONS,
    useValue: {
      ...defaultDialogOption,
    },
  }],
})
export class AngularMaterialModule { }
