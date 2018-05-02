import { ViewContainerRef, Component,Input,Output,EventEmitter,AfterViewInit,ViewChild,TemplateRef, OnDestroy } from '@angular/core'
import { RegionDescriptor, LabComponent, Landmark, Multilevel, DatasetInterface } from 'nehubaUI/nehuba.model';
import { MainController, LandmarkServices, WidgitServices, MultilevelProvider, InfoToUIService, SpatialSearch } from 'nehubaUI/nehubaUI.services';
import { RegionTemplateRefInterface } from 'nehubaUI/nehuba.model';
import { animationFadeInOut,animateCollapseShow } from 'nehubaUI/util/nehubaUI.util.animations'


@Component({
  selector : 'nehubaui-landmark-list',
  template : 
  `
  <div class = "panel-body">
    <ng-content>
    </ng-content>
    <div 
      landmarkEntry
      (mouseenter)="landmark.hover = true"
      (mouseleave)="landmark.hover = false"
      *ngFor = "let landmark of landmarkServices.landmarks">

      position : {{ landmark.properties['geometry.coordinates'] }}
    </div>
    <ul *ngIf = "false" class = "list-group" id = "landmarkList">
      <li
        (mouseenter)="landmark.hover = true"
        (mouseleave)="landmark.hover = false"
        class = "list-group-item"
        *ngFor="let landmark of landmarkServices.landmarks">

        <small>
          <span class = "text-muted">OID :</span> {{ landmark.properties['OID']  }}<br />
          <span class = "text-muted">coordinates :</span> [{{ landmark.properties['geometry.coordinates'] }}]
        </small>
      </li>
    </ul>
    
    <div *ngIf="landmarkServices.landmarks.length>0" class = "btn-group">

      <div class = "default-control btn btn-default btn-sm" (click)="spatialSearch.goTo(0)">
        <i class = "glyphicon glyphicon-fast-backward"></i>
      </div>
      <div class = "btn btn-default btn-sm" (click)="spatialSearch.goTo(spatialSearch.pagination-1)">
        <i class = "glyphicon glyphicon-step-backward"></i>
      </div>

      <div 
        (click)="spatialSearch.goTo(pageNum)"
        [ngClass]="{'btn-primary':spatialSearch.pagination == pageNum}"
        *ngFor = "let pageNum of Array.from(Array(Math.ceil(spatialSearch.numHits / spatialSearch.RESULTS_PER_PAGE)).keys()).filter(hidePagination)"
        class = "pagination-control btn btn-default btn-sm">
        {{ pageNum + 1 }}
      </div>

      <div class = "btn btn-default btn-sm" (click)="spatialSearch.goTo(spatialSearch.pagination+1)">
        <i class = "glyphicon glyphicon-step-forward"></i>
      </div>
      <div class = "btn btn-default btn-sm" (click)="spatialSearch.goTo( spatialSearch.numHits / spatialSearch.RESULTS_PER_PAGE + 1 )">
        <i class = "glyphicon glyphicon-fast-forward"></i>
      </div>

    </div>
    
    <div style="text-align:center; margin-top:10px;">
      {{ spatialSearch.numHits ? spatialSearch.numHits : 0 }} landmarks found.
    </div>

  </div>
  `,
  styles : [
    `
    div[landmarkEntry]
    {
      padding : 0.2em 1.0em;
    }
    div[landmarkEntry]:hover
    {
      cursor:default;
      background-color:rgba(128,128,128,0.2);
    }
    .btn-group
    {
      display:flex
    }

    .btn-group > .default-control
    {
      flex : 0 0 auto;
    }

    .btn-group > .pagination-control
    {
      flex : 1 1 auto;
    }
    ul.list-group#landmarkList > li.list-group-item:hover
    {
      cursor:default;
      background-color:rgba(128,128,128,0.2);
    }
    `
  ]
})

export class NehubaLandmarkList{
  @ViewChild('landmarkList',{read:TemplateRef}) landmarkList : TemplateRef<any>

  constructor(
    public mainController:MainController,
    public spatialSearch:SpatialSearch,
    public landmarkServices:LandmarkServices){

  }

  Array = Array
  Math = Math

  hidePagination = (idx:number) => {
    const correctedPagination = this.spatialSearch.pagination < 2 ?
      2 :
      this.spatialSearch.pagination > (Math.ceil(this.spatialSearch.numHits / this.spatialSearch.RESULTS_PER_PAGE) - 3) ?
        Math.ceil(this.spatialSearch.numHits / this.spatialSearch.RESULTS_PER_PAGE) - 3 :
        this.spatialSearch.pagination
    return (Math.abs(idx-correctedPagination) < 3)
  }
}

@Component({
  selector : `nehubaui-searchresult-region-list`,
  template : 
  `
  <ng-content>
  </ng-content>
  <div
    *ngFor = "let region of regions; let idx = index">

    <nehubaui-searchresult-region 
      [@animationFadeInOut]
      (hover)="subHover($event)"
      (showReceptorData)="showReceptorData(region,$event)"
      (mouseenter)="mouseEnterRegion.emit(region)" 
      (mouseleave)="mouseLeaveRegion.emit(region)"
      [region] = "region" 
      [idx] = "idx">
    </nehubaui-searchresult-region>
  </div>
  `,
  animations : [ animationFadeInOut ]
})
export class ListSearchResultCardRegion implements AfterViewInit{
  @Input() regions : RegionDescriptor[] = []
  @Input() title : string = `Untitled`
  @Input() startingMode : 'docked' | 'floating' | 'minimised' = 'docked'
  
  @Output() mouseEnterRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  @Output() mouseLeaveRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  
  constructor(
    public mainController:MainController,
    public landmarkServices:LandmarkServices){
  }

  /* Variables needed for listify receptor browser */
  Array = Array
  filterForReceptorData = (region:RegionDescriptor) => region.moreInfo.some(info=>info.name=='Receptor Data')

  ngAfterViewInit(){
    this.addRegionsWithReceptorData()
  }

  private unionRegionDescriptorArrays(rds1:RegionDescriptor[],rds2:RegionDescriptor[]){
    return rds2.reduce((acc,val)=>
      rds1.findIndex(rd=>rd === val)>=0 ? 
        acc : 
        acc.concat(val)
    ,rds1)
  }

  private findRegionsHaveReceptorData(rds:RegionDescriptor[]){
    return rds.filter(rd=>rd.moreInfo.some(info=>info.name==='Receptor Data'))
  }

  /* NB one of the few times regions are automatically added if they  */
  private addRegionsWithReceptorData(){
    const currRegions = this.mainController.selectedRegionsBSubject.getValue()
    const allRegionsWithRecpeotrData = this.findRegionsHaveReceptorData(Array.from(this.mainController.regionsLabelIndexMap.values()))
    const newRegions = this.unionRegionDescriptorArrays( currRegions , allRegionsWithRecpeotrData )
    this.mainController.selectedRegionsBSubject.next( newRegions )
  }

  showReceptorData(region:RegionDescriptor,templateRef:TemplateRef<any>){
    // const l = this.landmarkServices.landmarks.find(l=>l.id==region.name)
    // if(l) this.landmarkServices.changeLandmarkNodeView(l,templateRef)
    region
    templateRef
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
export class SearchResultCardRegion{
  @Input() region : RegionDescriptor
  @Input() idx : number

  @Output() hover : EventEmitter<any> = new EventEmitter()
  @Output() showReceptorData : EventEmitter<TemplateRef<any>> = new EventEmitter()

  @ViewChild('imgContainer',{read:TemplateRef}) imageContainer : TemplateRef<any>
  @ViewChild('showImgContainer',{read:ViewContainerRef}) showImageContainer : ViewContainerRef
  @ViewChild('receptorPanelBody',{read:TemplateRef}) receptorPanelBody : TemplateRef<any>

  receptorBrowserMultilevel:Multilevel
  constructor(public mainController:MainController,public widgitServices:WidgitServices){
    // this.receptorBrowserMultilevel = receptorBrowserMultilevel
    // const newMultilvl = initMultilvl(RECEPTOR_DATASTRUCTURE_JSON)
    // this.receptorBrowserMultilevel = newMultilvl
  }

  hasReceptorData = ()=>this.region.moreInfo.some(info=>info.name == 'Receptor Data')

  muteFilter = (m:Multilevel):boolean=>m.children.length > 0

  showBody = false
  imgSrc : string | null
  ntName : string
  mName : string
  landmark : Landmark

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
      this.mainController.selectedRegionsBSubject.next(this.mainController.selectedRegions.filter((_,i)=>i!=idx))
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
      /fingerprint/i.test(m.name) ? 
      `
      (()=>{
        const radarFingerprint = document.getElementById('default.default.receptorData.fingerprint.chart.${info!.source}')
        radarFingerprint.colors = [
          {
            backgroundColor : 'rgba(0,0,0,0.0)',
            borderColor : 'rgba(255,0,0,1)',
            pointBackgroundColor : 'rgba(255,0,0,0.5)',
            pointBorderColor : 'rgba(255,0,0,1)'
          },
          {
            backgroundColor : 'rgba(255,0,0,0.5)',
            borderColor : 'rgba(255,0,0,1)',
            pointBackgroundColor : 'rgba(255,0,0,0.5)',
            pointBorderColor : 'rgba(255,0,0,1)'
          },
        ]
        fetch('${JSON_RECEPTOR_ROOT}${info!.source}__fingerprint.json')
          .then(res=>res.json())
          .then(json=>{
            radarFingerprint.labels = json.map(arr=>arr[0])
            radarFingerprint.radarDatasets = ['4p','4p_sd'].map((label,idx)=>({
              label : label,
              data : json.map(el=>el[idx+1]),
              borderWidth : 1,
              borderDash : idx !== 0 ? [0] : [10,15],
              fill : idx !==0 ? 'origin' : false
            }))
          })
          .catch(console.warn)
      })()
      ` :
      `
      (()=>{

        const lineProfile = document.getElementById('default.default.receptorData.profile.chart.${info!.source}.${m.name}')
        lineProfile.colors = [
          {
            backgroundColor : 'rgba(0,0,0,0.0)',
            borderColor : 'rgba(255,0,0,1)'
          }
        ]
        const ntRName = lineProfile.getAttribute('nt_r_name')
        fetch('${JSON_RECEPTOR_ROOT}${info!.source}_pr_'+ntRName+'.json')
          .then(res=>res.json())
          .then(json=>{
            lineProfile.labels = Array.from(Array(json.length).keys())
            lineProfile.lineDatasets = [{
              label : ntRName + ' Profile',
              data : json,
              pointRadius : 0
            }]
          })
          .catch(console.warn)

        const modalHandler = interactiveViewer.uiHandle.modalControl.getModalHandler()
      
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
        #default.default.receptorData.fingerprint.chart
        {
          height:400px;
          position:relative;
        }
      </style>
      ` +
      (!info ? 
        `cannot find information on receptor data for ${this.region.name}` :
        /fingerprint/i.test(m.name) ? 
          `
          <radar-chart-component id = "default.default.receptorData.fingerprint.chart.${info!.source}">
          </radar-chart-component>
          ` :
            `
            <div style = "display:flex; width:100%;">
              <div imageWrapper class = "default.default.imageWrapper" style = "flex: 0 0 35%;">
                <img rbMode = "autoradiograph" src = "${RECEPTOR_ROOT + info.source}_bm_${m.name}.jpg" style = "width:100%;position:relative; z-index:10;" />
              </div>

              <line-chart-component nt_r_name = "${m.name}" style = "flex: 1 1 50%;" id = "default.default.receptorData.profile.chart.${info!.source}.${m.name}">
              </line-chart-component>
            </div>
            `)
    }
       
    const placeholder = `
    <div imageWrapper class = "default.default.imageWrapper">
      <img rbMode = "fingerprint" src = "${RECEPTOR_ROOT + info!.source}__fingerprint.jpg" style = "width:100%; position:relative; z-index:10;" />
    </div>
    `
    placeholder
    this.widgitServices.loadWidgetFromLabComponent(new LabComponent(metadata))
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
  `,
  animations : [ animationFadeInOut ]
})

export class ListSearchResultCardPill{
  @Input() regions : RegionDescriptor[]
  @Input() title : string = `Untitled`
  @Input() startingMode : 'docked' | 'floating' | 'minimised' = 'docked'
  @Input() additionalContent : string = ``

  @Output() mouseEnterRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  @Output() mouseLeaveRegion : EventEmitter<RegionDescriptor> = new EventEmitter()
  
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

  constructor(public mainController : MainController,public infoToUI:InfoToUIService){}

  ngAfterViewInit(){
  }

  ngOnDestroy(){
    
  }

  findMoreInfo(name:string){
    return this.region.moreInfo.find(info=>info.name==name)
  }

  showProperties(){
    const handler = this.infoToUI.getModalHandler()
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
      this.mainController.selectedRegionsBSubject.next(this.mainController.selectedRegions.filter((_,i)=>i!=idx))
    }else{
      console.warn('cannot find the region',this.region, this.mainController.selectedRegions)
    }
  }
}


const RECEPTOR_ROOT = `http://medpc055.ime.kfa-juelich.de:5082/plugins/receptorBrowser/data/`
const JSON_RECEPTOR_ROOT = `res/json/`
// const RECEPTOR_ROOT = `http://localhost:5080/pluginDev/receptorBrowser/data/`