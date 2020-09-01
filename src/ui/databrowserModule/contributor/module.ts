import { NgModule } from "@angular/core";
import { GetContributorKgLink } from "./kgLink.pipe";

@NgModule({
  declarations: [
    GetContributorKgLink
  ],
  exports: [
    GetContributorKgLink
  ]
})

export class ContributorModule{}