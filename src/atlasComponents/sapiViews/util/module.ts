import { NgModule } from "@angular/core";
import { AddUnitAndJoin } from "./addUnitAndJoin.pipe";
import { EqualityPipe } from "./equality.pipe";
import { NumbersPipe } from "./numbers.pipe";
import { ParseDoiPipe } from "./parseDoi.pipe";
import { BBoxToAABBPipe } from "./bboxToAABB.pipe";
import { GroupByPipe } from "src/util/pipes/groupBy.pipe";
import { ATPRToMarkdown } from "./atprToMd.pipe";

@NgModule({
  declarations: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    BBoxToAABBPipe,
    GroupByPipe,
    ATPRToMarkdown,
  ],
  exports: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    BBoxToAABBPipe,
    GroupByPipe,
    ATPRToMarkdown,
  ]
})

export class SapiViewsUtilModule{}
