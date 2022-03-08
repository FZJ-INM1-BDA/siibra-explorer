import { NgModule } from "@angular/core";
import { AddUnitAndJoin } from "./addUnitAndJoin.pipe";
import { IncludesPipe } from "./includes.pipe";
import { NumbersPipe } from "./numbers.pipe";
import { ParseDoiPipe } from "./parseDoi.pipe";

@NgModule({
  declarations: [
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    IncludesPipe,
  ],
  exports: [
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    IncludesPipe,
  ]
})

export class SapiViewsUtilModule{}