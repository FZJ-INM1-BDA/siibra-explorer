import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "src/components";
import { WidgetCanvas } from "./widgetCanvas.directive";
import { WidgetPortal } from "./widgetPortal/widgetPortal.component";
import { MatCardModule } from "@angular/material/card";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatButtonModule } from "@angular/material/button";
import { PortalModule } from "@angular/cdk/portal";

@NgModule({
  imports:[
    MatCardModule,
    DragDropModule,
    MatButtonModule,
    PortalModule,
    CommonModule,
    ComponentsModule,
  ],
  declarations: [
    WidgetCanvas,
    WidgetPortal,
  ],
  providers: [],
  exports: [
    WidgetCanvas,
  ]
})

export class WidgetModule{}
