import { NgModule } from "@angular/core";
import { StateAggregator } from "./stateAggregator.directive";

// TODO
// perhaps this should be called StateUtilModule?
// or alternatively, slowly move all state related components to this module?
// urlutil should also be at least in this module folder

@NgModule({
  declarations: [
    StateAggregator
  ],
  exports: [
    StateAggregator
  ]
})

export class StateModule{}
