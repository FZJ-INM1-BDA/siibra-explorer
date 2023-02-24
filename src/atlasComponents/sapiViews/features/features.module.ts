import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureViewComponent } from './feature-view/feature-view.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from "@angular/material/table"
import { MarkdownModule } from 'src/components/markdown';
import { TransformPdToDsPipe } from './transform-pd-to-ds.pipe';
import { SpinnerModule } from 'src/components/spinner';


@NgModule({
  declarations: [
    FeatureViewComponent,
    TransformPdToDsPipe,
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MarkdownModule,
    MatTableModule,
    SpinnerModule,
  ],
  exports: [
    FeatureViewComponent,
  ]
})
export class FeaturesModule { }
