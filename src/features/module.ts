import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatRippleModule } from "@angular/material/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatListModule } from "@angular/material/list";
import { MatTooltipModule } from "@angular/material/tooltip";
import { SpinnerModule } from "src/components/spinner";
import { UtilModule } from "src/util";
import { EntryComponent } from './entry/entry.component'
import { FeatureNamePipe } from "./featureName.pipe";
import { CategoryAccDirective } from './category-acc.directive';
import { SapiViewsFeatureConnectivityModule } from "./connectivity";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MarkdownModule } from "src/components/markdown";
import { MatTableModule } from "@angular/material/table";
import { FeatureViewComponent } from "./feature-view/feature-view.component";
import { TransformPdToDsPipe } from "./transform-pd-to-ds.pipe";
import { NgLayerCtlModule } from "src/viewerModule/nehuba/ngLayerCtlModule/module";
import { VoiBboxDirective } from "./voi-bbox.directive";
import { FilterCategoriesPipe } from "./filterCategories.pipe";
import { ListDirective } from "./list/list.directive";
import { MatChipsModule } from "@angular/material/chips";
import { FeatureFilterDirective } from "./feature.filter.directive";
import { GroupFeaturesToName } from "./grpFeatToName.pipe";

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
    SapiViewsFeatureConnectivityModule,
    ScrollingModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MarkdownModule,
    MatTableModule,
    NgLayerCtlModule,
    MatChipsModule,
  ],
  declarations: [
    EntryComponent,
    FeatureViewComponent,
    FilterCategoriesPipe,
    ListDirective,
    FeatureFilterDirective,

    CategoryAccDirective,
    VoiBboxDirective,

    FeatureNamePipe,
    TransformPdToDsPipe,
    GroupFeaturesToName,
  ],
  exports: [
    EntryComponent,
    FeatureViewComponent,
    VoiBboxDirective,
    ListDirective,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class FeatureModule{}