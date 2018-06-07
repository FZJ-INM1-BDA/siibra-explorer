import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core'

import { DomSanitizer } from '@angular/platform-browser';
import { DataEntry, File } from '../../services/stateStore.service';

@Component({
  selector : 'file-viewer',
  templateUrl : './fileviewer.template.html' ,
  styleUrls : [ 
    './fileviewer.style.css'
   ] 
})

export class FileViewer implements OnChanges,OnDestroy,AfterViewInit{
  @Input() searchResultFile : File
  @ViewChild('childChart') childChart : ChartComponentInterface

  constructor(private sanitizer:DomSanitizer){
  }

  private _downloadUrl : string
  private _pngDownloadUrl : string

  ngOnDestroy(){
    if(this._downloadUrl){
      URL.revokeObjectURL(this._downloadUrl)
    }
    if(this._pngDownloadUrl){
      URL.revokeObjectURL(this._pngDownloadUrl)
    }
  }

  ngOnChanges(){
    if(this._downloadUrl){
      URL.revokeObjectURL(this._downloadUrl)
    }
    if(!this.searchResultFile.url && this.searchResultFile.data){
      const stringJson = JSON.stringify(this.searchResultFile.data)
      const newBlob = new Blob([stringJson],{type:'application/octet-stream'})
      this._downloadUrl = URL.createObjectURL(newBlob)
    }
  }

  /* seems a bit buggy right now */
  ngAfterViewInit(){
    if(this.childChart){
      (<HTMLCanvasElement>this.childChart.canvas.nativeElement).toBlob((blob)=>{
        this._pngDownloadUrl = URL.createObjectURL(blob)
      },'image/png')
    }
  }
  
  get downloadUrl(){
    return this.searchResultFile.url ? 
      this.searchResultFile.url : 
      this._downloadUrl ? 
        this.sanitizer.bypassSecurityTrustResourceUrl(this._downloadUrl)  :
        null
  }

  get downloadName(){
    return this.searchResultFile.filename
  }

  get downloadPng(){
    return this._pngDownloadUrl ?
      this.sanitizer.bypassSecurityTrustResourceUrl(this._pngDownloadUrl) :
      null
  }
}

interface ChartComponentInterface{
  canvas : ElementRef
}

