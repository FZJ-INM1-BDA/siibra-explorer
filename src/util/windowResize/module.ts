import { NgModule } from "@angular/core";
import { ResizeObserverDirective } from "./windowResize.directive";
import { ResizeObserverService } from "./windowResize.service";

@NgModule({
  declarations: [
    ResizeObserverDirective
  ],
  exports: [
    ResizeObserverDirective
  ],
  providers: [
    ResizeObserverService
  ]
})

export class WindowResizeModule{}
