import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {ViewerPreviewFile} from "src/services/state/dataStore.store";
import {DatabrowserService} from "src/ui/databrowserModule/databrowser.service";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {MatDialog} from "@angular/material";
import {PreviewFileDialogComponent} from "src/ui/searchItemPreview/previewFileDialog.component";

@Component({
    selector: 'search-item-preview-component',
    templateUrl: './searchItemPreview.template.html',
    styleUrls: ['./searchItemPreview.style.css']
})

export class SearchItemPreviewComponent {
    @Input() datasetName: string

    @Output() freezeFilesSubMenu: EventEmitter<boolean> = new EventEmitter()
    @Output() filePreviewModalClosed: EventEmitter<boolean> = new EventEmitter()

    public previewFiles: ViewerPreviewFile[] = []
    public activeFile: ViewerPreviewFile
    private error: string
    previewFileDialogRef

    constructor(
        private dbrService:DatabrowserService,
        private constantsService: AtlasViewerConstantsServices,
        public dialog: MatDialog
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
                    this.renderNode = getRenderNodeFn(this.activeFile)
                })
                .catch(e => {
                    this.error = JSON.stringify(e)
                })
        }
    }

    openPreviewDialog(previewFile) {
        this.freezeFilesSubMenu.emit(true)
        this.filePreviewModalClosed.emit(false)
        this.previewFileDialogRef = this.dialog.open(PreviewFileDialogComponent, {
            width: '400px',
            data: {previewFile: previewFile},
            panelClass: [ 'no-scrolls', this.constantsService.darktheme? 'dialog-dark-background-color' : 'dialog-light-background-color'],
        })
        this.previewFileDialogRef.afterClosed().subscribe(result => {
            this.filePreviewModalClosed.emit(true)
        })
    }
}

const getRenderNodeFn = ({name : activeFileName = ''} = {}) => ({name = '', path = 'unpathed'}) => name
    ? activeFileName === name
        ? `<span class="text-warning">${name}</span>`
        : name
    : path
