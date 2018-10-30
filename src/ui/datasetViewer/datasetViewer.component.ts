import { Component, Input, Output, EventEmitter } from "@angular/core";
import { DataEntry } from "../../services/stateStore.service";

@Component({
  selector : 'dataset-viewer',
  templateUrl : './datasetViewer.template.html',
  styleUrls : ['./datasetViewer.style.css']
})

export class DatasetViewerComponent{
  @Input() dataset : DataEntry
  @Output() launchFileViewer : EventEmitter<{dataset:DataEntry, file:any}> = new EventEmitter()

  previewFileClick(ev, el){
    
    ev.event.preventDefault()
    ev.event.stopPropagation()

    if(ev.inputItem.children.length > 0){
      el.toggleCollapse(ev.inputItem)
    }else{
      this.launchFileViewer.emit({
        dataset : this.dataset,
        file : ev.inputItem
      })
    }
  }

  renderNode(obj){
    return obj.name
      ? obj.name
      : obj.path
  }
}