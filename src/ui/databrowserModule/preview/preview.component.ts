import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ViewerPreviewFile } from "src/services/state/dataStore.store";
import { DatabrowserService } from "../databrowser.service";

const getRenderNodeFn = ({name : activeFileName = ''} = {}) => ({name = '', path = 'unpathed'}) => name
  ? activeFileName === name
    ? `<span class="text-warning">${name}</span>`
    : name
  : path

@Component({
  selector: 'preview-component',
  templateUrl: './previewList.template.html',
  styleUrls: [
    './preview.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PreviewComponent implements OnInit {
  @Input() public datasetName: string
  @Output() public previewFile: EventEmitter<ViewerPreviewFile> = new EventEmitter()

  public fetchCompleteFlag: boolean = false

  public previewFiles: ViewerPreviewFile[] = []
  public activeFile: ViewerPreviewFile
  private error: string

  constructor(
    private dbrService: DatabrowserService,
    private cdr: ChangeDetectorRef,
  ) {
    this.renderNode = getRenderNodeFn()
  }

  public previewFileClick(ev, el) {

    ev.event.preventDefault()
    ev.event.stopPropagation()

    if (ev.inputItem.children.length > 0) {
      el.toggleCollapse(ev.inputItem)
    } else {
      this.activeFile = ev.inputItem
      this.renderNode = getRenderNodeFn(this.activeFile)
    }

    this.cdr.markForCheck()
  }

  public renderNode: (obj: any) => string

  public ngOnInit() {
    if (this.datasetName) {
      this.dbrService.fetchPreviewData(this.datasetName)
        .then(json => {
          this.previewFiles = json as ViewerPreviewFile[]
          if (this.previewFiles.length > 0) {
            this.activeFile = this.previewFiles[0]
            this.renderNode = getRenderNodeFn(this.activeFile)
          }
        })
        .catch(e => {
          this.error = JSON.stringify(e)
        })
        .finally(() => {
          this.fetchCompleteFlag = true
          this.cdr.markForCheck()
        })
    }
  }
}
