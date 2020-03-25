import { NgModule } from "@angular/core";
import { WidgetUnit } from "./widgetUnit.component";
import { WidgetServices } from "./widgetService.service";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "src/components/components.module";

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
    WidgetServices
  ],
  exports: [
    WidgetUnit
  ]
})

export class WidgetModule{}