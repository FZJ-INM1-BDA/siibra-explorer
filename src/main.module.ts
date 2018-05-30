import { NgModule } from "@angular/core";
import { ComponentsModule } from "./components/components.module";
import { UIModule } from "./ui/ui.module";
import { UITestComponent } from "./test/test.component";
import { Serv } from "./services/services.module";

@NgModule({
  imports : [
    ComponentsModule,
    UIModule,
    Serv.forRoot()
  ],
  declarations : [
    UITestComponent
  ],
  bootstrap : [
    UITestComponent
  ]
})

export class MainModule{

}