import { FullscreenOverlayContainer, OverlayContainer } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import {QuickTourThis} from "src/ui/quickTour/quickTourThis.directive";
import {QuickTourService} from "src/ui/quickTour/quickTour.service";
import {QuickTourComponent} from "src/ui/quickTour/quickToutComponent/quickTour.component";
import {QuickTourDirective} from "src/ui/quickTour/quickTour.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
  ],
  declarations:[
    QuickTourThis,
    QuickTourComponent,
    QuickTourDirective
  ],
  exports: [
    QuickTourDirective,
    QuickTourThis,
  ],
  providers:[
    {provide: OverlayContainer,
      useClass: FullscreenOverlayContainer
    },
    QuickTourService
  ]
})
export class QuickTourModule{}
