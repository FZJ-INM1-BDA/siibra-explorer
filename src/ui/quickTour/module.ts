import { FullscreenOverlayContainer, OverlayContainer } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import {QuickTourComponent} from "src/ui/quickTour/quickToutCmp/quickTour.component";
import {QuickTourDirective} from "src/ui/quickTour/quickTour.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
  ],
  declarations:[
    QuickTourDirective,
    QuickTourComponent,
  ],
  exports: [
    QuickTourDirective,
  ],
  providers:[{
    provide: OverlayContainer,
    useClass: FullscreenOverlayContainer
  }]
})
export class QuickTourModule{}
