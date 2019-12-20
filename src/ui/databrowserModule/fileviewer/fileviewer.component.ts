import { ChangeDetectorRef, Component, Inject, Input, OnChanges, Optional, ViewChild } from '@angular/core'

import { MAT_DIALOG_DATA } from '@angular/material';
import { ViewerPreviewFile } from 'src/services/state/dataStore.store';
import { ChartBase } from './chart/chart.base';

@Component({
  selector : 'file-viewer',
  templateUrl : './fileviewer.template.html' ,
  styleUrls : [
    './fileviewer.style.css',
   ],
})

export class FileViewer implements OnChanges {

  public childChart: ChartBase

  @ViewChild('childChart')
  set setChildChart(childChart: ChartBase) {
    this.childChart = childChart
    this.cdr.detectChanges()
  }

  /**
   * fetched directly from KG
   */
  @Input() public previewFile: ViewerPreviewFile

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) data,
  ) {
    if (data) {
      this.previewFile = data.previewFile
      this.downloadUrl = this.previewFile.url
    }
  }

  public downloadUrl: string
  public ngOnChanges() {
    this.downloadUrl = this.previewFile.url
  }
}
