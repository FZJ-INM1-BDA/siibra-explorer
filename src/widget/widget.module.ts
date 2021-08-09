import { NgModule } from "@angular/core";
import { WidgetUnit } from "./widgetUnit/widgetUnit.component";
import { WidgetServices } from "./widgetService.service";
import { AngularMaterialModule } from "src/sharedModules";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "src/components";

@NgModule({
  imports:[
    AngularMaterialModule,
    CommonModule,
    ComponentsModule,
  ],
  declarations: [
    WidgetUnit
  ],
  entryComponents: [
    WidgetUnit
  ],
  providers: [
    WidgetServices,
  ],
  exports: [
    WidgetUnit
  ]
})

export class WidgetModule{}
