import { ViewContainerRef, Component,Input,Output,EventEmitter,AfterViewInit,ViewChild,TemplateRef, OnDestroy } from '@angular/core'
import { RegionDescriptor, LabComponent, Landmark, Multilevel, DatasetInterface } from 'nehubaUI/nehuba.model';
import { MainController, LandmarkServices, TempReceptorData, WidgitServices, MultilevelProvider, initMultilvl, RECEPTOR_DATASTRUCTURE_JSON, ModalServices } from 'nehubaUI/nehubaUI.services';
import { RegionTemplateRefInterface } from 'nehubaUI/nehuba.model';
import { animationFadeInOut,animateCollapseShow } from 'nehubaUI/util/nehubaUI.util.animations'

@Component({
  selector : `nehubaui-searchresult-region-list`,
  template : 
  `
  <ng-template #regionList>
    <ng-content>
    </ng-content>
    <div
      *ngFor = "let region of regions; let idx = index"
      [@animationFadeInOut]>

      <nehubaui-searchresult-region 
        (hover)="subHover($event)"
        (showReceptorData)="showReceptorData(region,$event)"
        (mouseenter)="mouseEnterRegion.emit(region)" 
        (mouseleave)="mouseLeaveRegion.emit(region)"
        [region] = "region" 
        [idx] = "idx">
      </nehubaui-searchresult-region>
    </div>
  </ng-template>
  `,
  animations : [ animationFadeInOut ]
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

  /* Variables needed for listify receptor browser */
  Array = Array
  filterForReceptorData = (region:RegionDescriptor) => region.moreInfo.some(info=>info.name=='Receptor Data')

  widgetComponent : any
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
    this.mainController.selectedRegions = Array.from(this.mainController.regionsLabelIndexMap.values()).filter(r=>r.moreInfo.some(info=>info.name=='Receptor Data'))
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

@Component({
  selector : `nehubaui-searchresult-region`,
  template : 
  `
  <div class = "panel panel-default">
    <div
      (click) = "showBodyFn()" 
      class = "panel-heading">

      <span *ngIf = "hasReceptorData()">
        <i class = "glyphicon" [ngClass] = "showBody ? 'glyphicon-chevron-down' : 'glyphicon-chevron-right'" ></i>
        {{ region.name }}
      </span>
      <del *ngIf = "!hasReceptorData()">
        {{ region.name }}
      </del>

      <i 
        class = "close"
        (click) = "$event.stopPropagation(); close()">

        <i class = "glyphicon glyphicon-remove-sign"></i>
      </i>
      <i 
        class = "close"
        *ngIf = "findMoreInfo('Go To There')"
        (click) = "$event.stopPropagation(); findMoreInfo('Go To There').action()">

        <i class = "glyphicon glyphicon-screenshot"></i>
      </i>
    </div>
    <div style="overflow:hidden">
      <div [@animateCollapseShow] = "showBody ? 'show' : 'collapse'" #receptorPanelBody>
        <div class = "panel">
          <div class = "panel-body">
          
            <multilevel
              [muteFilter] = "muteFilter"
              (doubleClick) = "doubleClick($event)"
              (singleClick) = "singleClick($event)"
              [data] = "receptorBrowserMultilevel">
            </multilevel>

            <div #showImgContainer>
            </div>
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
  providers : [ MultilevelProvider ],
  animations : [ animateCollapseShow ]
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

  receptorBrowserMultilevel:Multilevel
  constructor(public landmarkServices:LandmarkServices,public mainController:MainController,public widgitServices:WidgitServices){
    // this.receptorBrowserMultilevel = receptorBrowserMultilevel
    const newMultilvl = initMultilvl(RECEPTOR_DATASTRUCTURE_JSON)
    this.receptorBrowserMultilevel = newMultilvl
  }

  hasReceptorData = ()=>this.region.moreInfo.some(info=>info.name == 'Receptor Data')

  muteFilter = (m:Multilevel):boolean=>m.children.length > 0

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

  findMoreInfo(name:string){
    return this.region.moreInfo.find(info=>info.name==name)
  }
  
  neurotransmitterName(string:any){
    this.ntName = string ? string : null
  }
  modeName(string:any){
    this.mName = string ? string : null
  }

  close(){
    const idx = this.mainController.selectedRegions.findIndex(r=>r.name == this.region.name)
    if(idx >= 0){
      this.mainController.selectedRegions.splice(idx,1)
    }else{
      console.warn('cannot find the region',this.region, this.mainController.selectedRegions)
    }
  }

  singleClick(m:Multilevel){

    if(m.children.length>0){
      return
    }

    const info = this.region.moreInfo.find(info=>info.name=='Receptor Data')

    const metadata = {
      name : `default.default.${this.region.name} ${m.name}`,
      script : 
      `
      (()=>{

        const modalHandler = uiHandle.modalControl.getModalHandler()
      
        const regionName = '${this.region.name}'
        let ntName
        let mName
  
        const imageWrappers = document.getElementsByClassName('default.default.imageWrapper')
        const array = Array.from(imageWrappers)
  
        array.forEach(div=>{
          if(div.classList.contains('installed')){
            return
          }
          Array.from(div.getElementsByTagName('img')).forEach(img=>{
            img.addEventListener('click',()=>{
              mName = img.getAttribute('rbMode')
              ntName = '${/fingerprint/i.test(m.name) ? ' ' : m.name}'
              const imgSrc = img.getAttribute('src')
              modalHandler.title = regionName + ' ' + ntName + ' ' + mName
              modalHandler.body = '<img style = "width:100%" src = "' + imgSrc + '" />'
              modalHandler.footer = '<a href = "' + imgSrc + '" target = "_blank">download jpg</a>'
              modalHandler.show()
            })
          })
          div.classList.add('installed')
        })
      })()
      `,
      template : 
      `
      <style>
        div[imageWrapper]
        {
          position:relative;
        }
        div[imageWrapper]:before
        {
          content: ' ';
          width:100%;
          height:100%;
          position:absolute;
          top:0px;
          left:0px;
          z-index:999;
          pointer-events:none;
          text-align:center;

          background-color:rgba(0,0,0,0);
          transition: background-color 0.5s ease;
        }
        div[imageWrapper]:hover:before
        {
          color : white;
          content: 'click to enlarge';
          background-color:rgba(0,0,0,0.3);
        }
        div[imageWrapper]:hover
        {
          cursor:pointer
        }
      </style>
      ` +
      (!info ? 
        `cannot find information on receptor data for ${this.region.name}` :
        /fingerprint/i.test(m.name) ? 
          `
          <div imageWrapper class = "default.default.imageWrapper">
            <img rbMode = "fingerprint" src = "${RECEPTOR_ROOT + info.source}__fingerprint.jpg" style = "width:100%; position:relative; z-index:10;" />
          </div>
          ` :
            `
            <div style = "display:flex; width:100%;">
              <div imageWrapper class = "default.default.imageWrapper" style = "flex: 0 0 35%;">
                <img rbMode = "autoradiograph" src = "${RECEPTOR_ROOT + info.source}_bm_${m.name}.jpg" style = "width:100%;position:relative; z-index:10;" />
              </div>
              <div imageWrapper class = "default.default.imageWrapper" style = "flex : 1 1 50%;">
                <img rbMode = "profile" src = "${RECEPTOR_ROOT + info.source}_pr_${m.name}.jpg" style = "width:100%;position:relative; z-index:10;" />
              </div>
            </div>
            `)
    }
       
    this.widgitServices.loadWidgetFromLabComponent(new LabComponent(metadata))
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
    if(!this.hasReceptorData()) return 
    this.showBody = !this.showBody
    // this.showReceptorData.emit(this.receptorPanelBody)
  }
}

@Component({
  selector : `nehubaui-searchresult-region-pill-list`,
  template :
  `
  <ng-template #regionList>
    <ng-content>
    </ng-content>
    <div
      *ngFor = "let region of regions"
      [@animationFadeInOut]>

      <nehubaui-searchresult-region-pill
        [region] = "region">
        <a 
          *ngIf = "additionalContent=='nifti'" 
          href = "{{region.PMapURL}}">
          download nifti
        </a>
      </nehubaui-searchresult-region-pill>
    </div>
  </ng-template>
  `,
  animations : [ animationFadeInOut ]
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
  widgetComponent:any
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
  <span class = "badge">
    <span>
      {{region.name}} 
    </span>
    <i 
      class = "close"
      (click) = "close()">
      <i class = "glyphicon glyphicon-remove-sign"></i>
    </i>
    <i
      *ngIf = "findMoreInfo('Go To There')"
      (click) = "findMoreInfo('Go To There').action()" 
      class = "close">
      <i class = "glyphicon glyphicon-screenshot"></i>
    </i>
    <i
      *ngIf = "region.propertiesURL"
      (click) = "showProperties()" 
      class = "close">
      <i class = "glyphicon glyphicon-info-sign"></i>
    </i>
    <br />
    <ng-content>
    </ng-content>
  </span>
  <ng-template #datasetTemplate>
    <div
      *ngIf = "!fetchedDatasetInfo">
      Fetching more information right now ...
    </div>
    <datasetBlurb
      [dataset] = "fetchedDatasetInfo"
      *ngIf = "fetchedDatasetInfo">
    </datasetBlurb>
  </ng-template>
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
  @ViewChild('datasetTemplate',{read:TemplateRef}) datasetTemplate : TemplateRef<any>
  fetchedDatasetInfo : DatasetInterface

  constructor(public mainController : MainController,public modalServices:ModalServices){}

  ngAfterViewInit(){
  }

  ngOnDestroy(){
    this.mainController.regionSelectionChanged()
  }

  findMoreInfo(name:string){
    return this.region.moreInfo.find(info=>info.name==name)
  }

  showProperties(){
    const handler = this.modalServices.getModalHandler()
    handler.title = `${this.region.name}`
    handler.showTemplateRef(this.datasetTemplate)

    fetch(this.region.propertiesURL)
      .then(d=>d.json())
      .then(json=>{
        this.fetchedDatasetInfo = json
      })
      .catch((e:any)=>{
        console.log(e)
        handler.bsModalRef.content.body = `Error fetching the information.`
      })
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