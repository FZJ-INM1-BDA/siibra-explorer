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
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MarkdownModule } from "src/components/markdown";
import { MatTableModule } from "@angular/material/table";
import { FeatureViewComponent } from "./feature-view/feature-view.component";
import { TransformPdToDsPipe } from "./transform-pd-to-ds.pipe";
import { NgLayerCtlModule } from "src/viewerModule/nehuba/ngLayerCtlModule/module";

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
  ],
  declarations: [
    EntryComponent,
    ListComponent,
    FeatureViewComponent,

    FetchDirective,
    CategoryAccDirective,

    FeatureNamePipe,
    TransformPdToDsPipe,
  ],
  exports: [
    EntryComponent,
    FeatureViewComponent,
  ]
})
export class FeatureModule{}