import { NgModule } from "@angular/core";
import { AddUnitAndJoin } from "./addUnitAndJoin.pipe";
import { EqualityPipe } from "./equality.pipe";
import { NumbersPipe } from "./numbers.pipe";
import { ParseDoiPipe } from "./parseDoi.pipe";
import { BBoxToAABBPipe } from "./bboxToAABB.pipe";

@NgModule({
  declarations: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    BBoxToAABBPipe,
  ],
  exports: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    BBoxToAABBPipe,
  ]
})

export class SapiViewsUtilModule{}