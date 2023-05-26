import { APP_BASE_HREF } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from '@angular/router'
import { RouterService } from "./router.service";
import { RouteStateTransformSvc } from "./routeStateTransform.service";
import { routes } from "./util";
import { EffectsModule } from "@ngrx/effects";
import { RouterEffects } from "./effects";


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
  ],
  exports:[
    RouterModule
  ]
})

export class AtlasViewerRouterModule{

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_service: RouterService){}
}
