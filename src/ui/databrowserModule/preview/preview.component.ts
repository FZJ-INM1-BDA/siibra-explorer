import { Component, Input, OnInit } from "@angular/core";
import { DatabrowserService } from "../databrowser.service";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";

@Component({
  selector: 'preview-component',
  templateUrl: './preview.template.html',
  styleUrls: [
    './preview.style.css'
  ]
})

export class PreviewComponent implements OnInit{
  @Input() datasetName: string

  public previewFiles: ViewerPreviewFile[] = []
  public activeFile: ViewerPreviewFile
  private error: string

  constructor(
    private dbrService:DatabrowserService
  ){
  
  }

  previewFileClick(ev, el){
    
    ev.event.preventDefault()
    ev.event.stopPropagation()

    if(ev.inputItem.children.length > 0){
      el.toggleCollapse(ev.inputItem)
    }else{
      this.activeFile = ev.inputItem
      // this.launchFileViewer.emit({
      //   dataset : this.dataset,
      //   file : ev.inputItem
      // })
    }
  }

  renderNode(obj){
    return obj.name
      ? this.activeFile.name === obj.name
        ? `<span class="text-warning">${obj.name}</span>`
        : obj.name
      : obj.path
  }

  ngOnInit(){
    if (this.datasetName) {
      this.dbrService.fetchPreviewData(this.datasetName)
        .then(json => {
          this.previewFiles = json as ViewerPreviewFile[]
          if (this.previewFiles.length > 0)
            this.activeFile = this.previewFiles[0]
        })
        .catch(e => {
          this.error = JSON.stringify(e)
        })
    }
  }
}