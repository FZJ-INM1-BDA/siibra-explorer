import {
  GetInitialLayerOpacityPipe,
  LayerBrowser,
  LockedLayerBtnClsPipe
} from './layerBrowserComponent/layerbrowser.component'
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../sharedModules/angularMaterial.module';
import { LayerDetailComponent } from './layerDetail/layerDetail.component';
import { FormsModule } from '@angular/forms';
import { UtilModule } from 'src/util';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AngularMaterialModule,
    UtilModule,
  ],
  declarations: [
    LayerBrowser,
    LayerDetailComponent,

    GetInitialLayerOpacityPipe,
    LockedLayerBtnClsPipe,
  ],
  exports: [
    GetInitialLayerOpacityPipe,
    LayerBrowser,
    LockedLayerBtnClsPipe
  ]
})

export class LayerBrowserModule{}