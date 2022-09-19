import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "src/components";
import { WidgetCanvas } from "./widgetCanvas.directive";
import { WidgetPortal } from "./widgetPortal/widgetPortal.component"
import { MatCardModule } from "@angular/material/card";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatButtonModule } from "@angular/material/button";
import { PortalModule } from "@angular/cdk/portal";
import { MatTooltipModule } from "@angular/material/tooltip";
import { WidgetStateIconPipe } from "./widgetStateIcon.pipe";

@NgModule({
  imports:[
    MatCardModule,
    DragDropModule,
    MatButtonModule,
    MatTooltipModule,
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
