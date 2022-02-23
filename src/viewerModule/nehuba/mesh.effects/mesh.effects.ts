import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { select, Store } from "@ngrx/store";
import { filter } from "jszip";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { actionSetAuxMeshes } from "../store";

@Injectable()
export class MeshEffects{
  constructor(private store: Store<any>){

  }
  // auxMeshEffect$ = createEffect(() => this.store.pipe(
    
  //   map(() => {
  //     console.log("TODO need to fix")
  //     return actionSetAuxMeshes({
  //       payload: []
  //     })
  //   })
  // ))
}