import { NgModule, ModuleWithProviders } from "@angular/core";
import { NehubaDataService } from "./nehubaData.service";


@NgModule({

})

export class Serv{
  static forRoot():ModuleWithProviders{
    return {
      ngModule : Serv,
      providers : [
        NehubaDataService
      ]
    }
  }
}

export { NehubaDataService } from './nehubaData.service'