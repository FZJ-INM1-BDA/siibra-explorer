import { NgModule } from "@angular/core";
import { AddUnitAndJoin } from "./addUnitAndJoin.pipe";
import { EqualityPipe } from "./equality.pipe";
import { IncludesPipe } from "./includes.pipe";
import { NumbersPipe } from "./numbers.pipe";
import { ParcellationSupportedInCurrentSpace } from "./parcellationSupportedInCurrentSpace.pipe";
import { ParcellationSupportedInSpacePipe } from "./parcellationSupportedInSpace.pipe";
import { ParseDoiPipe } from "./parseDoi.pipe";
import { SpaceSupportedInCurrentParcellationPipe } from "./spaceSupportedInCurrentParcellation.pipe";

@NgModule({
  declarations: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    IncludesPipe,
    ParcellationSupportedInSpacePipe,
    ParcellationSupportedInCurrentSpace,
    SpaceSupportedInCurrentParcellationPipe,
  ],
  exports: [
    EqualityPipe,
    ParseDoiPipe,
    NumbersPipe,
    AddUnitAndJoin,
    IncludesPipe,
    ParcellationSupportedInSpacePipe,
    ParcellationSupportedInCurrentSpace,
    SpaceSupportedInCurrentParcellationPipe,
  ]
})

export class SapiViewsUtilModule{}