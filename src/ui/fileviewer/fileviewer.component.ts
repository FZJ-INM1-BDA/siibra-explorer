import { Component, Input, OnChanges, OnDestroy, ViewChild, ElementRef, OnInit, Output, EventEmitter } from '@angular/core'

import { DomSanitizer } from '@angular/platform-browser';
import { File } from '../../services/stateStore.service';
import { interval,from } from 'rxjs';
import { switchMap,take,retry } from 'rxjs/operators'

@Component({
  selector : 'file-viewer',
  templateUrl : './fileviewer.template.html' ,
  styleUrls : [ 
    './fileviewer.style.css'
   ] 
})

export class FileViewer implements OnChanges,OnDestroy,OnInit{
  @Input() searchResultFile : File
  
  @ViewChild('childChart') childChart : ChartComponentInterface

  constructor(
    private sanitizer:DomSanitizer
  ){
  }

  private _downloadUrl : string
  private _pngDownloadUrl : string

  ngOnDestroy(){
    this.revokeUrls()
  }

  ngOnInit(){
    this.createUrls()
  }
  ngOnChanges(){
    this.revokeUrls()
    this.createUrls()
  }

  get downloadUrl(){
    return this.searchResultFile.url ? 
      this.searchResultFile.url : 
      this._downloadUrl ? 
        this.sanitizer.bypassSecurityTrustResourceUrl(this._downloadUrl)  :
        null
  }

  /* TODO require better way to check if a chart exists */
  private createUrls(){

    const timer$ = interval(50)
    const timerSet$ = timer$.pipe(
      switchMap(()=>from(new Promise((rs,rj)=>{
        if(!this.childChart)
          rj('chart not defined after 500ms')
        
        this.childChart.canvas.nativeElement.toBlob((blob)=>{
          blob ? rs(blob) : rj('blob is undefined')
          
        },'image/png')
        }))),
      retry(10),
      take(1)
    )

    timerSet$.subscribe((blob)=>{
      this._pngDownloadUrl = URL.createObjectURL(blob)
    },(err)=>console.warn('warning',err))


    if(!this.searchResultFile.url && this.searchResultFile.data){
      const stringJson = JSON.stringify(this.searchResultFile.data)
      const newBlob = new Blob([stringJson],{type:'application/octet-stream'})
      this._downloadUrl = URL.createObjectURL(newBlob)
    }
  }

  private revokeUrls(){
    if(this._downloadUrl){
      URL.revokeObjectURL(this._downloadUrl)
    }
    if(this._pngDownloadUrl){
      URL.revokeObjectURL(this._pngDownloadUrl)
    }
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

