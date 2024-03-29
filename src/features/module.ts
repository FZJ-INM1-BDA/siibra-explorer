import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { SpinnerModule } from "src/components/spinner";
import { UtilModule } from "src/util";
import { EntryComponent } from './entry/entry.component'
import { FeatureNamePipe } from "./featureName.pipe";
import { CategoryAccDirective } from './category-acc.directive';
import { SapiViewsFeatureConnectivityModule } from "./connectivity";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MarkdownModule } from "src/components/markdown";
import { FeatureViewComponent } from "./feature-view/feature-view.component";
import { NgLayerCtlModule } from "src/viewerModule/nehuba/ngLayerCtlModule/module";
import { VoiBboxDirective } from "./voi-bbox.directive";
import { FilterCategoriesPipe } from "./filterCategories.pipe";
import { ListDirective } from "./list/list.directive";
import { FeatureFilterDirective } from "./feature.filter.directive";
import { GroupFeaturesToName } from "./grpFeatToName.pipe";
import { ReadmoreModule } from "src/components/readmore";
import { GroupFeatureTallyPipe } from "./grpFeatToTotal.pipe";
import { PlotlyComponent } from "./plotly";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports: [
    CommonModule,
    SpinnerModule,
    UtilModule,
    SapiViewsFeatureConnectivityModule,
    ScrollingModule,
    MarkdownModule,
    NgLayerCtlModule,
    ReadmoreModule,
    AngularMaterialModule,
    
    /**
     * standalone components
     */
    PlotlyComponent,
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
    GroupFeaturesToName,
    GroupFeatureTallyPipe,
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