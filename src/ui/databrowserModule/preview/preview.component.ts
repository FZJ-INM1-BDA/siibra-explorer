import { Component, Input, OnInit } from "@angular/core";
import { DatabrowserService } from "../databrowser.service";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";

const getRenderNodeFn = ({name : activeFileName = ''} = {}) => ({name = '', path = 'unpathed'}) => name
? activeFileName === name
  ? `<span class="text-warning">${name}</span>`
  : name
: path

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
    this.renderNode = getRenderNodeFn()
  }

  previewFileClick(ev, el){
    
    ev.event.preventDefault()
    ev.event.stopPropagation()

    if(ev.inputItem.children.length > 0){
      el.toggleCollapse(ev.inputItem)
    }else{
      this.activeFile = ev.inputItem
      this.renderNode = getRenderNodeFn(this.activeFile)
    }
  }

  public renderNode: (obj:any) => string

  ngOnInit(){
    if (this.datasetName) {
      this.dbrService.fetchPreviewData(this.datasetName)
        .then(json => {
          this.previewFiles = json as ViewerPreviewFile[]
          if (this.previewFiles.length > 0)
            this.activeFile = this.previewFiles[0]
            if (!this.dbrService.darktheme && this.activeFile && this.activeFile.data && this.activeFile.data.colors) {
              this.activeFile.data.colors = this.activeFile.data.colors.map(colors => {
                return {...colors, borderColor: 'rgba(0,0,0,0.5)', mixBlendMode: 'difference'}
              })
            }
            this.renderNode = getRenderNodeFn(this.activeFile)
        })
        .catch(e => {
          this.error = JSON.stringify(e)
        })
    }
  }
}