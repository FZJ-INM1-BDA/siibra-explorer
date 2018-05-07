import { Component, Input, OnChanges, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core'
import { SearchResultFileInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './fileViewer.template.html'
import css from './fileViewer.style.css'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { MainController } from 'nehubaUI/nehubaUI.services';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector : 'file-viewer',
  template ,
  styles : [ css ] 
})

export class FileViewer implements OnChanges,OnDestroy,AfterViewInit{
  @Input() searchResultFile : SearchResultFileInterface
  @ViewChild('childChart') childChart : ChartComponentInterface

  constructor(private mainController:MainController,private sanitizer:DomSanitizer){
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

  ngAfterViewInit(){
    if(this.childChart){
      (<HTMLCanvasElement>this.childChart.canvas.nativeElement).toBlob((blob)=>{
        this._pngDownloadUrl = URL.createObjectURL(blob)
      },'application/octet-stream')
    }
  }

  transformRegionNameToRegionDescriptor(region:{regionName:string,relationship:string,moreInfo:string}):RegionDescriptor|undefined{
    return Array.from(this.mainController.regionsLabelIndexMap.values()).find(rd=>rd.name==region.regionName)
  }

  get hasRelatedRegion(){
    return this.searchResultFile.parentDataset.regionName ?
      this.searchResultFile.parentDataset.regionName.filter((r:any)=>r.regionName!='none').length > 0 :
      false
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