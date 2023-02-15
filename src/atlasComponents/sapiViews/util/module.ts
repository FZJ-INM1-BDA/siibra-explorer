import { NgModule } from "@angular/core";
import { AddUnitAndJoin } from "./addUnitAndJoin.pipe";
import { EqualityPipe } from "./equality.pipe";
import { IncludesPipe } from "./includes.pipe";
import { NumbersPipe } from "./numbers.pipe";
import { ParseDoiPipe } from "./parseDoi.pipe";

@NgModule({
  declarations: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    IncludesPipe,
  ],
  exports: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    IncludesPipe,
  ]
})

export class SapiViewsUtilModule{}