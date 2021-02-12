import { APP_BASE_HREF } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from '@angular/router'
import { RouterService } from "./router.service";
import { routes } from "./util";


@NgModule({
  imports:[
    RouterModule.forRoot(routes, {
      useHash: true
    })
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    },
    RouterService
  ],
  exports:[
    RouterModule
  ]
})

export class AtlasViewerRouterModule{

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_service: RouterService){}
}
