import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
    selector: 'preview-file-dialog-component',
    template: '<file-viewer [previewFile]="data.previewFile"></file-viewer>',
})
export class PreviewFileDialogComponent {
    constructor(public dialogRef: MatDialogRef<PreviewFileDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {}

}
