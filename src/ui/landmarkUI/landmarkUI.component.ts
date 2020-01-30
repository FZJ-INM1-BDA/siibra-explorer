import { Component, Input } from "@angular/core";
import { IDataEntry } from "src/services/stateStore.service";

@Component({
  selector: 'landmark-ui',
  templateUrl: './landmarkUI.template.html',
  styleUrls: [
    './landmarkUI.style.css'
  ]
})

export class LandmarkUIComponent{
  @Input() name: string
  @Input() fullId: string
  @Input() datasets: Partial<IDataEntry>[]
}