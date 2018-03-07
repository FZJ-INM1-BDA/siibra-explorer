import { ViewContainerRef, Component,Input,Output,EventEmitter,AfterViewInit,ViewChild,TemplateRef, OnDestroy } from '@angular/core'
import { RegionDescriptor, LabComponent } from 'nehubaUI/nehuba.model';
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

    this.selectedRegionsWithReceptorData()

    this.landmarkServices.landmarks = this.regions.map(r=>({
      pos : r.position.map(number=>number / 1000000) as [number,number,number],
      id : r.name,
      hover : false,
      properties : r
    }))

    this.landmarkServices.landmarks.forEach((l,idx)=>this.landmarkServices.TEMP_parseLandmarkToVtk(l,idx,7,'d20'))
    this.landmarkServices.TEMP_clearVtkHighlight()
  }

  ngOnDestroy(){
    this.widgetComponent.parentViewRef.destroy()    
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }

  private selectedRegionsWithReceptorData(){
    this.mainController.selectedRegions = this.regions
    this.mainController.regionSelectionChanged()
  }

  showReceptorData(region:RegionDescriptor,templateRef:TemplateRef<any>){
    const l = this.landmarkServices.landmarks.find(l=>l.id==region.name)
    if(l) this.landmarkServices.changeLandmarkNodeView(l,templateRef)
  }

  hover(region:RegionDescriptor){
    const idx = this.landmarkServices.landmarks.findIndex(l=>l.id==region.name)
    if(idx >= 0) {
      this.landmarkServices.landmarks[idx].hover = true
      this.landmarkServices.TEMP_vtkHighlight(idx)
    }
  }

  unhover(region:RegionDescriptor){
    const idx = this.landmarkServices.landmarks.findIndex(l=>l.id==region.name)
    if(idx >= 0) {
      this.landmarkServices.landmarks[idx].hover = false
      this.landmarkServices.TEMP_clearVtkHighlight(idx)
    }
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
          <receptorDataDriver 
            [regionName]="region.name" 
            (neurotransmitterName)="neurotransmitterName($event)" 
            (modeName) = "modeName($event)"
            (receptorString)="receptorString($event)">
          </receptorDataDriver>
          <div #showImgContainer>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ng-template #imgContainer>
    <span (click)="showOnBiggie()" id = "showOnBiggie" class = "close" showOnBiggie>
      <i class = "glyphicon glyphicon-new-window"></i>
    </span> 
    <img [src] = "imgSrc" />
  </ng-template>
  `,
  styles : [
    `
    span.close#showOnBiggie[showOnBiggie]
    {
      position:relative;
      right:0.5em;
      top:0.5em;
      margin-bottom:-1em;
      color:black !important;
      z-index:11;
    }
    img
    {
      width:100%;
      position:relative;
      z-index:10;
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
      padding-top:1em;
      padding-bottom:1em;
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
  ntName : string
  mName : string
  
  neurotransmitterName(string:any){
    this.ntName = string ? string : null
  }
  modeName(string:any){
    this.mName = string ? string : null
  }
  
  receptorString(string:any){
    this.mName = /^__fingerprint/.test(string) ? 
      'fingerprint' :
      /^_pr/.test(string) ? 
        'profile' :
        /^_bm/.test(string) ?
          'autoradiograph' :
          '? mode'

    this.ntName = !string ? null : 
      this.mName == 'fingerprint' ? 
        '' : 
        string.split('_')[2] 

    const info = this.region.moreInfo.find(info=>info.name=='Receptor Data')
    this.imgSrc = string && info && info.source ? RECEPTOR_ROOT + info.source + string : null
    if(this.imgSrc){
      this.showImageContainer.createEmbeddedView( this.imageContainer )
    }else{
      this.showImageContainer.remove()
    }
  }

  showOnBiggie(){
    const metadata = {
      name : `default.default.${this.region.name} ${this.ntName} ${this.mName}`,
      script : ``,
      template : `<img src = "${this.imgSrc}" style = "width:100%; position:relative; z-index:10;" />`
    }

    this.mainController.loadWidget(new LabComponent(metadata))
    // this.mainController.createDisposableWidgets(metadata)
  }

  showBodyFn(){
    this.showBody = !this.showBody
    // this.showReceptorData.emit(this.receptorPanelBody)
  }
}

const RECEPTOR_ROOT = `http://medpc055.ime.kfa-juelich.de:5082/plugins/receptorBrowser/data/`