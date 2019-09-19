import { NgModule } from "@angular/core";
import { FilterNullPipe } from "./pipes/filterNull.pipe";
import { FilterRowsByVisbilityPipe } from "src/components/flatTree/filterRowsByVisibility.pipe";

@NgModule({
  declarations: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe
  ],
  exports: [
    FilterNullPipe,
    FilterRowsByVisbilityPipe
  ]
})

export class UtilModule{

}