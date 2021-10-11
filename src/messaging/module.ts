import { NgModule } from "@angular/core";
import { ComponentsModule } from "src/components";

import { AngularMaterialModule } from "src/sharedModules";
import { MessagingService } from "./service";


@NgModule({
  imports: [
    AngularMaterialModule,
    ComponentsModule,
  ],
  providers: [
    MessagingService,
  ]
})

export class MesssagingModule{
  // need to inject service
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_mS: MessagingService){
  }
}
