import { Component } from "@angular/core";

type Landmark = {} & {
  showInSliceView
}

@Component({
  templateUrl: `./ieegSession.template.html`,
  styleUrls: [
    `./ieegSession.style.css`
  ]
})

export class IEEGSessionCmp{
  private loadedLms: Landmark[]

  private unloadLandmarks(){}
  private loadlandmarks(lms: Landmark[]){}
  private handleDatumExpansion(dataset: any){

  }
  private handleContactPtClick(contactPt){
    // navigate there

  }
}