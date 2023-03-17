import { NgModule } from "@angular/core";
import { AddUnitAndJoin } from "./addUnitAndJoin.pipe";
import { EqualityPipe } from "./equality.pipe";
import { NumbersPipe } from "./numbers.pipe";
import { ParseDoiPipe } from "./parseDoi.pipe";

@NgModule({
  declarations: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
  ],
  exports: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
  ]
})

export class SapiViewsUtilModule{}