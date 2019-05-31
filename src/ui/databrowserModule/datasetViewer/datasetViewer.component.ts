import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from "@angular/core";
import { DataEntry } from "src/services/stateStore.service";

@Component({
  selector : 'dataset-viewer',
  templateUrl : './datasetViewer.template.html',
  styleUrls : ['./datasetViewer.style.css']
})

export class DatasetViewerComponent{
  @Input() dataset : DataEntry
  
  @Output() showPreviewDataset: EventEmitter<{datasetName:string, event:MouseEvent}> = new EventEmitter()
  @ViewChild('kgrRef', {read:ElementRef}) kgrRef: ElementRef

  previewDataset(event:MouseEvent){
    if (!this.dataset.preview) return
    this.showPreviewDataset.emit({
      event,
      datasetName: this.dataset.name
    })
    event.stopPropagation()
  }

  clickMainCard(event:MouseEvent) {
    if (this.kgrRef) this.kgrRef.nativeElement.click()
  }

  get methods(): string[]{
    return this.dataset.activity.reduce((acc, act) => {
      return acc.concat(act.methods)
    }, [])
  }

  get hasKgRef(): boolean{
    return this.kgReference.length > 0
  }

  get kgReference(): string[] {
    return this.dataset.kgReference.map(ref => `https://doi.org/${ref}`)
  }
}