import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { QuickTourModule } from "src/ui/quickTour";
import { AngularMaterialModule } from "src/sharedModules";
import { UtilModule } from "src/util";
import { ViewerStateBreadCrumb } from "./breadcrumb/breadcrumb.component";
import { OriginalDatainfoPipe } from "./pipes/originDataInfo.pipe"
import { DialogInfoModule } from "src/ui/dialogInfo";

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    QuickTourModule,
    UtilModule,
    DialogInfoModule,
  ],
  declarations: [
    ViewerStateBreadCrumb,
    OriginalDatainfoPipe,
  ],
  exports: [
    ViewerStateBreadCrumb,
  ],
  providers:[
  ]
})

export class ViewerStateBreadCrumbModule{}