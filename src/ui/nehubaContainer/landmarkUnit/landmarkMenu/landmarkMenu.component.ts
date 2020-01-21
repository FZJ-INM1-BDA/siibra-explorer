import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from "@angular/core";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";

@Component({
    selector: 'landmark-menu',
    templateUrl: './landmarkMenu.template.html'
})
export class LandmarkMenuComponent {
    @Input() landmark: any
    @Output() closeLandmarkMenu: EventEmitter<any> = new EventEmitter<any>()
    @ViewChild('spatialDatasetPreview', {read: TemplateRef}) spatialDatasetPreview: TemplateRef<any>

    private spatialLandmarkDatasetDialog: MatDialogRef<any>


    constructor(private matDialog: MatDialog,) {}

    exploreDataset() {
        this.spatialLandmarkDatasetDialog = this.matDialog.open(this.spatialDatasetPreview)
        this.closeLandmarkMenu.emit()
    }
}