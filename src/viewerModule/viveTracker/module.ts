import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'
import { ViveTrackerSignal } from "./viveTrackerSignal/viveTrackerSignal.component";
import { ViveTrackerService } from "./service";
import { ViveTrackerControlViewRef } from "./signal.directive";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  declarations: [
    ViveTrackerSignal,
    ViveTrackerControlViewRef,
  ],
  exports: [
    ViveTrackerSignal,
    ViveTrackerControlViewRef,
  ],
  providers: [
    ViveTrackerService,
  ],
})
export class ViveTrackerModule {}
