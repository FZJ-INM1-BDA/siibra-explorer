import { NgModule } from '@angular/core';

import { InterfaceComponent } from './interface/interface.component';
import { TutorialComponent } from './tutorial/tutorial.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { IsMobileService } from './resources/services/is-Movile.service';
import {CommonModule} from "@angular/common";
import {AngularMaterialModule} from "src/ui/sharedModules/angularMaterial.module";
import {HelpPageComponent} from "src/ui/helpPage/helpPage.component";
import {RouterModule} from "@angular/router";


@NgModule({
  declarations: [
    HelpPageComponent,
    InterfaceComponent,
    TutorialComponent,
    NavMenuComponent,
    HomeComponent,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule.forChild([{path: '', component: HelpPageComponent}]),

  ],
  providers: [IsMobileService],
})
export class HelpPageModule { }
