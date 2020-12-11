import { EventEmitter } from "@angular/core";
import { IFeature } from "../regionalFeature.service";

export interface ISingleFeature{
  feature: IFeature
  region: any
  viewChanged: EventEmitter<null>
}
