import { FullscreenOverlayContainer, OverlayContainer } from "@angular/cdk/overlay";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { UtilModule } from "src/util";
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module";
import { QuickTourThis } from "src/ui/quickTour/quickTourThis.directive";
import { QuickTourService } from "src/ui/quickTour/quickTour.service";
import { QuickTourComponent } from "src/ui/quickTour/quickTourComponent/quickTour.component";
import { QuickTourDirective } from "src/ui/quickTour/quickTour.directive";
import { ArrowComponent } from "./arrowCmp/arrow.component";
import { WindowResizeModule } from "src/util/windowResize";
import { QUICK_TOUR_CMP_INJTKN } from "./constrants";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    UtilModule,
    WindowResizeModule,
  ],
  declarations:[
    QuickTourThis,
    QuickTourComponent,
    QuickTourDirective,
    ArrowComponent,
  ],
  exports: [
    QuickTourDirective,
    QuickTourThis,
  ],
  providers:[
    {
      provide: OverlayContainer,
      useClass: FullscreenOverlayContainer
    },
    QuickTourService,
    {
      provide: QUICK_TOUR_CMP_INJTKN,
      useValue: QuickTourComponent
    }
  ]
})
export class QuickTourModule{}
