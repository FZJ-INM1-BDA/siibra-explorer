import { ViewContainerRef, Component,Input,Output,EventEmitter,AfterViewInit,ViewChild,TemplateRef, OnDestroy } from '@angular/core'
import { RegionDescriptor, LabComponent, Landmark, Multilevel } from 'nehubaUI/nehuba.model';
import { MainController, LandmarkServices, TempReceptorData, WidgitServices, MultilevelProvider, initMultilvl, RECEPTOR_DATASTRUCTURE_JSON } from 'nehubaUI/nehubaUI.services';
import { WidgetComponent } from 'nehubaUI/nehubaUI.widgets.component';
import { RegionTemplateRefInterface } from 'nehubaUI/nehubaUI.viewerContainer.component';

@Component({
  selector : `nehubaui-searchresult-region-list`,
  template : 
  `
  <ng-template #regionList>
    <nehubaui-searchresult-region 
      (hover)="subHover($event)"
      (showReceptorData)="showReceptorData(region,$event)"
      (mouseenter)="mouseEnterRegion.emit(region)" 
      (mouseleave)="mouseLeaveRegion.emit(region)"
      [region] = "region" 
      [idx] = "idx"
      *ngFor = "let region of regions; let idx = index">
    </nehubaui-searchresult-region>
  </ng-template>
  `
})
export class ListSearchResultCardRegion implements AfterViewInit,OnDestroy{
  @Input() regions : RegionDescriptor[] = []
  @Input() title : string = `Untitled`
  @Input() startingMode : 'docked' | 'floating' | 'minimised' = 'docked'
  
  @Output() mouseEnterRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  @Output() mouseLeaveRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  
  @ViewChild('regionList',{read:TemplateRef}) regionList : TemplateRef<any>
  constructor(
    public mainController:MainController,
    public landmarkServices:LandmarkServices,
    public widgitServices:WidgitServices){
  }

  widgetComponent : WidgetComponent
  ngAfterViewInit(){
    this.widgetComponent = this.widgitServices.widgitiseTemplateRef(this.regionList,{name:this.title})
    this.widgetComponent.changeState(this.startingMode)
    
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }

    this.selectedRegionsWithReceptorData()

    // this.landmarkServices.landmarks = this.regions.map(r=>({
    //   pos : r.position.map(number=>number / 1000000) as [number,number,number],
    //   id : r.name,
    //   hover : false,
    //   properties : r
    // }))

    // this.landmarkServices.landmarks.forEach((l,idx)=>this.landmarkServices.TEMP_parseLandmarkToVtk(l,idx,7,'d20'))
    // this.landmarkServices.TEMP_clearVtkHighlight()
  }

  ngOnDestroy(){
    this.widgitServices.unloadWidget(this.widgetComponent)
    // this.widgetComponent.parentViewRef.destroy()    
    // if(this.mainController.nehubaViewer){
    //   this.mainController.nehubaViewer.redraw()
    // }
  }

  private selectedRegionsWithReceptorData(){
    this.mainController.selectedRegions = this.regions
    this.mainController.regionSelectionChanged()
  }

  showReceptorData(region:RegionDescriptor,templateRef:TemplateRef<any>){
    const l = this.landmarkServices.landmarks.find(l=>l.id==region.name)
    if(l) this.landmarkServices.changeLandmarkNodeView(l,templateRef)
  }

  /* hover status inside the searchresult-region card */
  subHover(item:any){
    console.log(item)
  }
}

/* Component exclusively used for displaying landmarks... used by iEEG dataset for now */
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
        
          <multilevel
            (singleClick) = "singleClick($event)"
            [data] = "receptorBrowserMultilevel">

          </multilevel>

          <receptorDataDriver 
            *ngIf = "false"
            [regionName]="region.name" 
            (neurotransmitterName)="neurotransmitterName($event)" 
            (modeName) = "modeName($event)"
            (receptorString)="receptorString($event)"
            #receptorDataDriver>
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
      background-color:rgba(0,0,0,0.2);
      padding:0.4em;
      display:block;
    }
    `
  ],
  providers : [ MultilevelProvider ]
})
export class SearchResultCardRegion implements OnDestroy, AfterViewInit{
  @Input() region : RegionDescriptor
  @Input() idx : number

  @Output() hover : EventEmitter<any> = new EventEmitter()
  @Output() showReceptorData : EventEmitter<TemplateRef<any>> = new EventEmitter()

  @ViewChild('imgContainer',{read:TemplateRef}) imageContainer : TemplateRef<any>
  @ViewChild('showImgContainer',{read:ViewContainerRef}) showImageContainer : ViewContainerRef
  @ViewChild('receptorPanelBody',{read:TemplateRef}) receptorPanelBody : TemplateRef<any>
  @ViewChild('receptorDataDriver') receptorDataComponent : TempReceptorData

  receptorBrowserMultilevel:Multilevel[]
  constructor(public landmarkServices:LandmarkServices,public mainController:MainController,public widgitServices:WidgitServices){
    // this.receptorBrowserMultilevel = receptorBrowserMultilevel
    const newMultilvl = initMultilvl(RECEPTOR_DATASTRUCTURE_JSON)
    this.receptorBrowserMultilevel = [newMultilvl]
  }

  showBody = false
  imgSrc : string | null
  ntName : string
  mName : string
  landmark : Landmark

  ngOnDestroy(){
    this.landmarkServices.removeLandmark(this.landmark)
  }

  ngAfterViewInit(){
    try{
      this.landmark = ({
        pos : this.region.position.map(n=>n/1e6) as [number,number,number],
        id : this.region.name,
        hover: false,
        properties:this.region
      }) as Landmark

      this.landmarkServices.addLandmark(this.landmark)
      this.landmarkServices.TEMP_parseLandmarkToVtk(this.landmark,this.idx,7,'d20')
    }catch(e){
      console.error('could not add landmark',e)
    }
  }
  
  neurotransmitterName(string:any){
    this.ntName = string ? string : null
  }
  modeName(string:any){
    this.mName = string ? string : null
  }

  singleClick(m:Multilevel){
    console.log(m)
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
        string.split(/\_|\./gi)[2] 

    const info = this.region.moreInfo.find(info=>info.name=='Receptor Data')
    this.imgSrc = string && info && info.source ? RECEPTOR_ROOT + info.source + string : null

    if(this.imgSrc){
      this.showOnBiggie()
      this.receptorDataComponent.popStack()
      // this.showImageContainer.createEmbeddedView( this.imageContainer )
    }else{
      // this.showImageContainer.remove()
    }
  }

  showOnBiggie(){
    const metadata = {
      name : `default.default.${this.region.name} ${this.ntName} ${this.mName}`,
      script : ``,
      template : `<img src = "${this.imgSrc}" style = "width:100%; position:relative; z-index:10;" />`
    }

    this.widgitServices.loadWidgetFromLabComponent(new LabComponent(metadata))
    // this.mainController.createDisposableWidgets(metadata)
  }

  showBodyFn(){
    this.showBody = !this.showBody
    // this.showReceptorData.emit(this.receptorPanelBody)
  }
}

@Component({
  selector : `nehubaui-searchresult-region-pill-list`,
  template :
  `
  <ng-template #regionList>
    <nehubaui-searchresult-region-pill
      [region] = "region"
      *ngFor = "let region of regions">
      <a 
        *ngIf = "additionalContent=='nifti'" 
        href = "{{region.PMapURL}}">
        download nifti
      </a>
    </nehubaui-searchresult-region-pill>
  </ng-template>
  `
})

export class ListSearchResultCardPill implements AfterViewInit,OnDestroy{
  @Input() regions : RegionDescriptor[]
  @Input() title : string = `Untitled`
  @Input() startingMode : 'docked' | 'floating' | 'minimised' = 'docked'
  @Input() additionalContent : string = ``

  @Output() mouseEnterRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  @Output() mouseLeaveRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  

  constructor(public mainController:MainController,public landmarkServices:LandmarkServices,public widgetServices:WidgitServices){

  }

  @ViewChild('regionList',{read:TemplateRef}) regionList : TemplateRef<any>
  widgetComponent:WidgetComponent
  ngAfterViewInit(){
    this.widgetComponent = this.widgetServices.widgitiseTemplateRef(this.regionList,{name:this.title})
    this.widgetComponent.changeState(this.startingMode)
    if(this.mainController){
      this.mainController.nehubaViewer.redraw()
    }
  }

  ngOnDestroy(){
    this.widgetServices.unloadWidget(this.widgetComponent)
  }
}

@Component({
  selector : `nehubaui-searchresult-region-pill`,
  template : 
  `
  <div>
    <span class = "badge">
      {{region.name}} 
      <i 
        (click) = "close()"
        class = "glyphicon glyphicon-remove-sign">
      </i> <br />
      <ng-content>
      </ng-content>
    </span>
  <div>
  `,
  styles : [
    `
    span.badge
    {
      text-align:left;
    }
    `
  ]
})
export class SearchResultPillRegion implements OnDestroy,AfterViewInit{

  @Input() region :RegionDescriptor
  @Input() idx : number
  @Input() mode : string = `default`

  @Input() regionTemplate : TemplateRef<RegionTemplateRefInterface>

  constructor(public mainController : MainController){}

  ngAfterViewInit(){
  }

  ngOnDestroy(){
    this.mainController.regionSelectionChanged()
  }

  close(){
    const idx = this.mainController.selectedRegions.findIndex(r=>r.name == this.region.name)
    if(idx >= 0){
      this.mainController.selectedRegions.splice(idx,1)
    }else{
      console.warn('cannot find the region',this.region, this.mainController.selectedRegions)
    }
  }
}



const RECEPTOR_ROOT = `http://medpc055.ime.kfa-juelich.de:5082/plugins/receptorBrowser/data/`
// const RECEPTOR_ROOT = `http://localhost:5080/pluginDev/receptorBrowser/data/`