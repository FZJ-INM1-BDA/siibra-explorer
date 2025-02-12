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
import { VoiBboxDirective } from "./voi-bbox.directive";
import { FilterCategoriesPipe } from "./filterCategories.pipe";
import { ListDirective } from "./list/list.directive";
import { FeatureFilterDirective } from "./feature.filter.directive";
import { GroupFeaturesToName } from "./grpFeatToName.pipe";
import { ReadmoreModule } from "src/components/readmore";
import { GroupFeatureTallyPipe } from "./grpFeatToTotal.pipe";
import { PlotlyComponent } from "./plotly";
import { AngularMaterialModule } from "src/sharedModules";
// import { AtlasColorMapIntents } from "./atlas-colormap-intents";
import { CompoundFeatureIndicesModule } from "./compoundFeatureIndices"
import { FEATURE_CONCEPT_TOKEN, FeatureConcept, TPRB } from "./util";
import { BehaviorSubject } from "rxjs";
import { TPBRViewCmp } from "./TPBRView/TPBRView.component";
import { DialogModule } from "src/ui/dialogInfo";
import { CodeSnippet } from "src/atlasComponents/sapi/codeSnippets/codeSnippet.directive";
import { ExperimentalFlagDirective } from "src/experimental/experimental-flag.directive";
import { FeatureViewBase } from "./view/view-base.directive";
import { NgLayerCtrlCmp } from "src/viewerModule/nehuba/nehubaViewerInterface/ngLayerCtl/ngLayerCtrl.component";

@NgModule({
  imports: [
    CommonModule,
    SpinnerModule,
    UtilModule,
    SapiViewsFeatureConnectivityModule,
    ScrollingModule,
    MarkdownModule,
    NgLayerCtrlCmp,
    ReadmoreModule,
    AngularMaterialModule,
    CompoundFeatureIndicesModule,
    DialogModule,
    
    /**
     * standalone components
     */
    PlotlyComponent,
    FeatureFilterDirective,
    // AtlasColorMapIntents,
    TPBRViewCmp,
    CodeSnippet,
    ExperimentalFlagDirective,
  ],
  declarations: [
    EntryComponent,
    FeatureViewComponent,
    FeatureViewBase,
    FilterCategoriesPipe,
    ListDirective,

    CategoryAccDirective,
    VoiBboxDirective,

    FeatureNamePipe,
    GroupFeaturesToName,
    GroupFeatureTallyPipe,
  ],
  exports: [
    EntryComponent,
    FeatureViewComponent,
    FeatureViewBase,
    VoiBboxDirective,
    ListDirective,
  ],
  providers: [
    {
      provide: FEATURE_CONCEPT_TOKEN,
      useFactory: () => {
        const obs = new BehaviorSubject<{ id: string, concept: TPRB}>({id: null, concept: {}})
        const returnObj: FeatureConcept = {
          register: (id, concept) => obs.next({ id, concept }),
          concept$: obs.asObservable()
        }
        return returnObj
      }
    }
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class FeatureModule{}