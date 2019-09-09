import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from "@angular/core";
import {ViewerPreviewFile} from "src/services/state/dataStore.store";
import {DatabrowserService} from "src/ui/databrowserModule/databrowser.service";
import {AtlasViewerConstantsServices} from "src/atlasViewer/atlasViewer.constantService.service";
import {MatDialog} from "@angular/material";
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
    @Input() parcellationRegions


    @Output() freezeFilesSubMenu: EventEmitter<boolean> = new EventEmitter()
    @Output() filePreviewModalClosed: EventEmitter<boolean> = new EventEmitter()
    @Output() closeSearchMenu: EventEmitter<boolean> = new EventEmitter()

    @ViewChild("previewFileModal") previewFileModal: TemplateRef<any>


    public previewFiles: ViewerPreviewFile[] = []
    public activeFile: ViewerPreviewFile
    private error: string
    previewFileDialogRef

    regionsofParcellation: any[] = []

    constructor(
        private dbrService: DatabrowserService,
        public constantsService: AtlasViewerConstantsServices,
        private dbService: DatabrowserService,
        public dialog: MatDialog,
        private store: Store<any>,
        private toastService: ToastService,
    ) {}

    ngOnInit() {
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

    openPreviewDialog(previewFile) {
        if (previewFile.mimetype !== 'application/nifti') {
            this.freezeFilesSubMenu.emit(true)
            this.filePreviewModalClosed.emit(false)
            this.previewFileDialogRef = this.dialog.open(this.previewFileModal, {
                width: '400px',
                data: previewFile,
                panelClass: ['no-scrolls'],
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
                this.regionsofParcellation = []
                this.getRegionsFromParcellation(this.parcellationRegions)
                // this.regionsofParcellation.forEach(sr => {
                //     if (sr.name.includes(' - left hemisphere')) {
                //         if (previewFile.filename.includes(sr.name.replace(' - left hemisphere', '')) && previewFile.filename.includes('left hemisphere')) {
                //             this.navigateToRegion(sr)
                //         }
                //     }
                //     if (sr.name.includes(' - right hemisphere')) {
                //         if (previewFile.filename.includes(sr.name.replace(' - right hemisphere', '')) && previewFile.filename.includes('right hemisphere')) {
                //             this.navigateToRegion(sr)
                //         }
                //     }
                // })
                this.closeSearchMenu.emit(true)
            }
        }
    }



    getRegionsFromParcellation  = (regions) => {
        for (let i = 0; i<regions.length; i ++) {
            if (regions[i].children && regions[i].children.length) {
                this.getRegionsFromParcellation(regions[i].children)
            } else {
                this.regionsofParcellation.push(regions[i])
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
