import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { ViewerStateInterface } from "../services/stateStore.service";


@Injectable()
export class AtlasViewerDataService{
  constructor(private store : Store<ViewerStateInterface>){

  }
}