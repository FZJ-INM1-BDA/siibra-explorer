import { Component, Input, Output, EventEmitter } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

@Component({
  selector : 'dataset-viewer',
  templateUrl : './datasetViewer.template.html',
  styleUrls : ['./datasetViewer.style.css']
})

export class DatasetViewerComponent{
  @Input() dataset : DataEntry
  
  @Output() showPreviewDataset: EventEmitter<{datasetName:string, event:MouseEvent}> = new EventEmitter()


  previewDataset(event:MouseEvent){
    this.showPreviewDataset.emit({
      event,
      datasetName: this.dataset.name
    })
  }


  get methods(): string[]{
    return this.dataset.activity.reduce((acc, act) => {
      return acc.concat(act.methods)
    }, [])
  }

  get kgReference(): string[] {
    return this.dataset.kgReference.map(ref => `https://doi.org/${ref}`)
  }
}