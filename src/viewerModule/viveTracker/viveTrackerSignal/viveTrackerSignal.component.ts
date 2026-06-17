import { Component } from "@angular/core";
import { ViveTrackerService } from "../service";

@Component({
  selector: 'vive-tracker-signal',
  templateUrl: './viveTrackerSignal.template.html',
  styleUrls: ['./viveTrackerSignal.style.css']
})
export class ViveTrackerSignal {
  public connected$ = this.svc.connected$
  public pose$ = this.svc.pose$

  constructor(private svc: ViveTrackerService) {}
}
