import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "src/components";
import { WidgetCanvas } from "./widgetCanvas.directive";
import { WidgetPortal } from "./widgetPortal/widgetPortal.component"
import { PortalModule } from "@angular/cdk/portal";
import { WidgetStateIconPipe } from "./widgetStateIcon.pipe";
import { AngularMaterialModule } from "src/sharedModules";

@NgModule({
  imports:[
    AngularMaterialModule,
    PortalModule,
    CommonModule,
    ComponentsModule,
  ],
  declarations: [
    WidgetCanvas,
    WidgetPortal,
    WidgetStateIconPipe,
  ],
  providers: [],
  exports: [
    WidgetCanvas,
  ]
})

export class WidgetModule{}
