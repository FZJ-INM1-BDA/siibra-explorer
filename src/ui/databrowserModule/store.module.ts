import { NgModule } from "@angular/core";
import { stateStore } from "src/services/state/uiState.store";
import { DataBrowserUseEffect } from "./databrowser.useEffect";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";

export const DATESTORE_FEATURE_KEY = `dataStore`

@NgModule({
  imports: [
    StoreModule.forFeature(DATESTORE_FEATURE_KEY, stateStore),
    EffectsModule.forFeature([ DataBrowserUseEffect ])
  ]
})

export class DataBrowserFeatureStore{}