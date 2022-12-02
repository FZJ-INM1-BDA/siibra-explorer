import { CommonModule } from "@angular/common";
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { Store } from "@ngrx/store";
import { ComponentsModule } from "src/components";
import { AngularMaterialModule } from "src/sharedModules";
import { atlasAppearance } from "src/state";
import { StrictLocalModule } from "src/strictLocal";
import { DialogModule } from "src/ui/dialogInfo/module";
import { UtilModule } from "src/util";
import { SapiViewsUtilModule } from "../../util";
import { FilterGroupedParcellationPipe } from "./filterGroupedParcellations.pipe";
import { FilterUnsupportedParcPipe } from "./filterUnsupportedParc.pipe";
import { ParcellationDoiPipe } from "./parcellationDoi.pipe";
import { ParcellationVisibilityService } from "./parcellationVis.service";
import { ParcellationGroupSelectedPipe } from "./parcellationGroupSelected.pipe";

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule,
    AngularMaterialModule,
    UtilModule,
    SapiViewsUtilModule,
    DialogModule,
    StrictLocalModule
  ],
  declarations: [
    FilterGroupedParcellationPipe,
    FilterUnsupportedParcPipe,
    ParcellationDoiPipe,
    ParcellationGroupSelectedPipe,
  ],
  exports: [
    FilterGroupedParcellationPipe,
    FilterUnsupportedParcPipe,
    ParcellationGroupSelectedPipe,
    ParcellationDoiPipe,
  ],
  providers: [
    ParcellationVisibilityService,
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store, svc: ParcellationVisibilityService) => {
        svc.visibility$.subscribe(val => {
          store.dispatch(
            atlasAppearance.actions.setShowDelineation({
              flag: val
            })
          )
        })
        return () => Promise.resolve()
      },
      multi: true,
      deps: [ Store, ParcellationVisibilityService ]
    }
  ]
})

export class SapiViewsCoreParcellationModule{}