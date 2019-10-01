import { Component, Input, ViewChild, ElementRef, Inject, Optional, OnChanges } from '@angular/core'

import { ViewerPreviewFile } from 'src/services/state/dataStore.store';
import { MAT_DIALOG_DATA } from '@angular/material';
import { CommonChartInterface } from './chart.interface';


@Component({
  selector : 'file-viewer',
  templateUrl : './fileviewer.template.html' ,
  styleUrls : [ 
    './fileviewer.style.css'
   ] 
})

export class FileViewer implements OnChanges{
  /**
   * fetched directly from KG
   */
  @Input() previewFile : ViewerPreviewFile
  
  @ViewChild('childChart') childChart: CommonChartInterface

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) data
  ){
    if (data) this.previewFile = data.previewFile
  }

  public downloadUrl: string
  ngOnChanges(){
    this.downloadUrl = this.previewFile.url
  }
}
