import { Component } from "@angular/core";
import { map } from "rxjs/operators";
import { LeapService } from "../service";
import { HandShape } from "../service"

@Component({
  selector: 'leap-control-signal',
  templateUrl: './leapSignal.template.html',
  styleUrls: [
    './leapSignal.style.css'
  ]
})
export class LeapSignal{
  public ready$ = this.svc.leapReady$
  public handDetected$ = this.svc.hand$.pipe(
    map(hands => hands && hands.length > 0)
  )
  public gestureText$ = this.svc.gesture$.pipe(
    map(gesture => {
      if (gesture === HandShape.PINCHING) {
        return "Pinching"
      }
      if (gesture === HandShape.PALM_FORWARD) {
        return "Zooming"
      }
      if (gesture === HandShape.POINTING_ONE_FINGER) {
        return "Translating"
      }
      if (gesture === HandShape.POINTING_TWO_FINGERS) {
        return "Oblique Cutting"
      }
      return null
    })
  )
  constructor(
    private svc: LeapService
  ){

  }
}
