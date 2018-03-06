import { ViewContainerRef, Component,Input,Output,EventEmitter,AfterViewInit,ViewChild,TemplateRef, OnDestroy } from '@angular/core'
import { RegionDescriptor, WidgitiseTempRefMetaData } from 'nehubaUI/nehuba.model';
import { MainController, LandmarkServices } from 'nehubaUI/nehubaUI.services';
import { WidgetComponent } from 'nehubaUI/nehubaUI.widgets.component';

@Component({
  selector : `nehubaui-searchresult-region-list`,
  template : 
  `
  <ng-template #regionList>
    <nehubaui-searchresult-region 
      (hover)="subHover($event)"
      (showReceptorData)="showReceptorData(region,$event)"
      (mouseenter)="hover(region)" 
      (mouseleave)="unhover(region)"
      [region] = "region" 
      *ngFor = "let region of regions">
    </nehubaui-searchresult-region>
  </ng-template>
  `
})
export class ListSearchResultCardRegion implements AfterViewInit,OnDestroy{
  @Input() regions : RegionDescriptor[] = []
  @Input() title : string = `Untitled`
  @ViewChild('regionList',{read:TemplateRef}) regionList : TemplateRef<any>
  constructor(public mainController:MainController,public landmarkServices:LandmarkServices){
    
  }

  widgetComponent : WidgetComponent
  ngAfterViewInit(){
    this.widgetComponent = this.mainController.widgitiseTemplateRef(this.regionList,{name:this.title})
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }

    this.landmarkServices.landmarks = this.regions.map(r=>({
      pos : r.position.map(number=>number / 1000000) as [number,number,number],
      id : r.name,
      hover : false,
      properties : r
    }))
  }

  ngOnDestroy(){
    this.widgetComponent.parentViewRef.destroy()    
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }

  showReceptorData(region:RegionDescriptor,templateRef:TemplateRef<any>){
    const l = this.landmarkServices.landmarks.find(l=>l.id==region.name)
    console.log(l,templateRef)
    if(l) this.landmarkServices.changeLandmarkNodeView(l,templateRef)
  }

  hover(region:RegionDescriptor){
    const l = this.landmarkServices.landmarks.find(l=>l.id==region.name)
    if(l) l.hover = true
  }

  unhover(region:RegionDescriptor){
    const l = this.landmarkServices.landmarks.find(l=>l.id==region.name)
    if(l) l.hover = false
  }

  /* hover status inside the searchresult-region card */
  subHover(item:any){
    console.log(item)
  }
}

@Component({
  selector : `nehubaui-searchresult-region`,
  template : 
  `
  <div class = "panel panel-default">
    <div
      (click) = "showBodyFn()" 
      class = "panel-heading">
      <span>
        {{ region.name }}
      </span>
    </div>
    <div *ngIf = "showBody" #receptorPanelBody>
      <div class = "panel">
        <div class = "panel-body">
          <receptorDataDriver [receptorName]="region.name" (receptorString)="receptorString($event)">
          </receptorDataDriver>
          <div #showImgContainer>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ng-template #imgContainer>
    <img [src] = "imgSrc" />
    <span (click)="showOnBiggie()">Show On Bigscreen</span>
  </ng-template>
  `,
  styles : [
    `
    img
    {
      width:100%;
    }
    .panel-heading
    {
      position:relative;
    }
    .panel-heading:hover
    {
      cursor:default;
    }
    .panel-heading:before
    {
      position:absolute;
      left:0px;
      top:0px;
      width:100%;
      height:100%;
      content: ' ';
    }
    .panel-heading:hover:before
    {
      background-color:rgba(128,128,128,0.1);
    }
    receptorDataDriver
    {
      margin-top:1em;
      display:block;
    }
    `
  ]
})
export class SearchResultCardRegion{
  @Input() region : RegionDescriptor
  @Output() hover : EventEmitter<any> = new EventEmitter()
  @Output() showReceptorData : EventEmitter<TemplateRef<any>> = new EventEmitter()
  @ViewChild('imgContainer',{read:TemplateRef}) imageContainer : TemplateRef<any>
  @ViewChild('showImgContainer',{read:ViewContainerRef}) showImageContainer : ViewContainerRef
  @ViewChild('receptorPanelBody',{read:TemplateRef}) receptorPanelBody : TemplateRef<any>

  constructor(public landmarkServices:LandmarkServices,public mainController:MainController){

  }

  showBody = false
  imgSrc : string | null
  title : string
  receptorString(string:any){
    this.title = string ? string : null
    const info = this.region.moreInfo.find(info=>info.name=='Receptor Data')
    this.imgSrc = string && info && info.source ? RECEPTOR_ROOT + info.source + string : null
    if(this.imgSrc){
      this.showImageContainer.createEmbeddedView( this.imageContainer )
    }else{
      this.showImageContainer.remove()
    }
  }

  showOnBiggie(){
    console.log(this.region.name)
    const metadata : WidgitiseTempRefMetaData = {
      name : this.region.name + this.title,
      onShutdownCleanup : ()=>{
        console.log('onshutdown cleanup')
      }
    }
    console.log(metadata)

    // this.mainController.createDisposableWidgets(metadata)
  }

  showBodyFn(){
    this.showBody = !this.showBody
    // this.showReceptorData.emit(this.receptorPanelBody)
  }
}

const RECEPTOR_ROOT = `http://medpc055.ime.kfa-juelich.de:5082/plugins/receptorBrowser/data/`