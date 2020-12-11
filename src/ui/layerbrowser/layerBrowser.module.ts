import {
  GetInitialLayerOpacityPipe,
  LayerBrowser,
  LockedLayerBtnClsPipe
} from './layerBrowserComponent/layerbrowser.component'
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../sharedModules/angularMaterial.module';
import { GetFilenamePipe } from './getFilename.pipe';
import { LayerDetailComponent } from './layerDetail/layerDetail.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AngularMaterialModule
  ],
  declarations: [
    LayerBrowser,
    LayerDetailComponent,

    GetInitialLayerOpacityPipe,
    LockedLayerBtnClsPipe,
    GetFilenamePipe
  ],
  exports: [
    GetInitialLayerOpacityPipe,
    LayerBrowser,
    LockedLayerBtnClsPipe
  ]
})

export class LayerBrowserModule{}