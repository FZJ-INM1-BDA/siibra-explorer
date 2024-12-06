import { Injectable } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { MainState, userPreference } from "src/state";

@Injectable({
  providedIn: "root"
})

export class ExperimentalService {
  
  showExperimentalFlag$ = this.store.pipe(
    select(userPreference.selectors.showExperimental)
  )
  
  constructor(private store: Store<MainState>){

  }
}
