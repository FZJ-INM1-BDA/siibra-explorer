import { APP_BASE_HREF } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from '@angular/router'
import { RouterService } from "./router.service";
import { RouteStateTransformSvc } from "./routeStateTransform.service";
import { DECODE_ENCODE, routes, decodeCustomState } from "./util";
import { EffectsModule } from "@ngrx/effects";
import { RouterEffects } from "./effects";
import { NEHUBA_CONFIG_SERVICE_TOKEN, getParcNgId, getNehubaConfig } from "src/viewerModule/nehuba/config.service";


@NgModule({
  imports:[
    RouterModule.forRoot(routes, {
      useHash: true
    }),
    EffectsModule.forFeature([
      RouterEffects
    ])
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    },
    RouterService,
    RouteStateTransformSvc,
    {
      provide: DECODE_ENCODE,
      useValue: { decodeCustomState }
    },
    {
      provide: NEHUBA_CONFIG_SERVICE_TOKEN,
      useValue: { getParcNgId, getNehubaConfig }
    }
  ],
  exports:[
    RouterModule
  ]
})

export class AtlasViewerRouterModule{

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_service: RouterService){}
}
