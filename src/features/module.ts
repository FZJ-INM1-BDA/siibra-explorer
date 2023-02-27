import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SpinnerModule } from "src/components/spinner";
import { UtilModule } from "src/util";
import { EntryComponent } from './entry/entry.component'
import { FeatureNamePipe } from "./featureName.pipe";
import { FetchDirective } from "./fetch.directive";
import { ListComponent } from './list/list.component';
import { CategoryAccDirective } from './category-acc.directive';
import { SapiViewsFeatureConnectivityModule } from "./connectivity";

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatExpansionModule,
    SpinnerModule,
    MatListModule,
    MatTooltipModule,
    UtilModule,
    MatRippleModule,
    SapiViewsFeatureConnectivityModule
  ],
  declarations: [
    EntryComponent,
    ListComponent,

    FetchDirective,
    CategoryAccDirective,

    FeatureNamePipe,
  ],
  exports: [
    EntryComponent,
  ]
})
export class FeatureModule{}