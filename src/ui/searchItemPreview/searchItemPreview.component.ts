import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";
import {ViewerPreviewFile} from "src/services/state/dataStore.store";
import {DatabrowserService} from "src/ui/databrowserModule/databrowser.service";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {MatDialog} from "@angular/material";
import {PreviewFileDialogComponent} from "src/ui/searchItemPreview/previewFileDialog.component";
import {CHANGE_NAVIGATION} from "src/services/state/viewerState.store";
import {Store} from "@ngrx/store";
import {ToastService} from "src/services/toastService.service";

@Component({
    selector: 'search-item-preview-component',
    templateUrl: './searchItemPreview.template.html',
    styleUrls: ['./searchItemPreview.style.css']
})

export class SearchItemPreviewComponent {
    @Input() datasetName: string
    @Input() selectedRegions


    @Output() freezeFilesSubMenu: EventEmitter<boolean> = new EventEmitter()
    @Output() filePreviewModalClosed: EventEmitter<boolean> = new EventEmitter()
    @Output() closeSearchMenu: EventEmitter<boolean> = new EventEmitter()

    public previewFiles: ViewerPreviewFile[] = []
    public activeFile: ViewerPreviewFile
    private error: string
    previewFileDialogRef

    constructor(
        private dbrService: DatabrowserService,
        private constantsService: AtlasViewerConstantsServices,
        private dbService: DatabrowserService,
        public dialog: MatDialog,
        private store: Store<any>,
        private toastService: ToastService,
    ) {
        this.renderNode = getRenderNodeFn()
    }

    public renderNode: (obj: any) => string

    ngOnInit() {
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
        if (previewFile.mimetype !== 'application/nifti') {
            this.freezeFilesSubMenu.emit(true)
            this.filePreviewModalClosed.emit(false)
            this.previewFileDialogRef = this.dialog.open(PreviewFileDialogComponent, {
                width: '400px',
                data: {previewFile: previewFile},
                panelClass: ['no-scrolls', this.constantsService.darktheme ? 'dialog-dark-background-color' : 'dialog-light-background-color'],
            })
            this.previewFileDialogRef.afterClosed().subscribe(result => {
                this.filePreviewModalClosed.emit(true)
            })
        } else {
            if (this.niftiLayerIsShowing(previewFile)) {
                this.removeDedicatedViewOnAtlasViewer(previewFile)
            }
            else {
                this.showDedicatedViewOnAtlasViewer(previewFile)

                this.selectedRegions.forEach(sr => {
                    if (sr.name.includes(' - left hemisphere')) {
                        if (previewFile.filename.includes(sr.name.replace(' - left hemisphere', '')) && previewFile.filename.includes('left hemisphere')) {
                            this.navigateToRegion(sr)
                            this.closeSearchMenu.emit(true)
                        }
                    }
                    if (sr.name.includes(' - right hemisphere')) {
                        if (previewFile.filename.includes(sr.name.replace(' - right hemisphere', '')) && previewFile.filename.includes('right hemisphere')) {
                            this.navigateToRegion(sr)
                            this.closeSearchMenu.emit(true)
                        }
                    }
                })
            }
        }
    }


    niftiLayerIsShowing(previewFile){
        return this.dbService.ngLayers.has(previewFile.url)
    }

    showDedicatedViewOnAtlasViewer(previewFile){
        this.dbService.showNewNgLayer({ url: previewFile.url })
    }

    removeDedicatedViewOnAtlasViewer(previewFile){
        this.dbService.removeNgLayer({ url: previewFile.url })
    }

    navigateToRegion(region) {
        if (region.position) {
            this.store.dispatch({
                type: CHANGE_NAVIGATION,
                navigation: {
                    position: region.position
                },
                animation: {}
            })
        } else {
            this.toastService.showToast(`${region.name} does not have a position defined`, {
                timeout: 5000,
                dismissable: true
            })
        }
    }
}

const getRenderNodeFn = ({name : activeFileName = ''} = {}) => ({name = '', path = 'unpathed'}) => name
    ? activeFileName === name
        ? `<span class="text-warning">${name}</span>`
        : name
    : path
