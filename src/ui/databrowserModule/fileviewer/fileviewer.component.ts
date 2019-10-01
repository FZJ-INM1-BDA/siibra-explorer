import { Component, Input, ViewChild, ElementRef, Inject, Optional, OnChanges } from '@angular/core'

import { ViewerPreviewFile } from 'src/services/state/dataStore.store';
import { MAT_DIALOG_DATA } from '@angular/material';


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
  
  @ViewChild('childChart') childChart : ChartComponentInterface

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

interface ChartComponentInterface{
  canvas : ElementRef,
  shapedLineChartDatasets: any
}

