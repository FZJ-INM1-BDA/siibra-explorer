import { Component, Input } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";

@Component({
  selector : 'dataset-viewer',
  templateUrl : './datasetViewer.template.html',
  styleUrls : ['./datasetViewer.style.css']
})

export class DatasetViewerComponent{
  @Input() dataset : DataEntry
}