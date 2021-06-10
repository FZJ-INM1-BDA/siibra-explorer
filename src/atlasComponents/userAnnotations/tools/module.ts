import { NgModule } from "@angular/core";
import { Subject } from "rxjs";
import { ModularUserAnnotationToolService } from "./service";
import { ANNOTATION_EVENT_INJ_TOKEN } from "./type";

@NgModule({
  providers: [
    {
      provide: ANNOTATION_EVENT_INJ_TOKEN,
      useValue: new Subject()
    },
    ModularUserAnnotationToolService
  ]
})

export class UserAnnotationToolModule {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_svc: ModularUserAnnotationToolService){}
}
