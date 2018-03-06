import { Component,Input,Output,EventEmitter,AfterViewInit,ViewChild,TemplateRef, OnDestroy } from '@angular/core'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { MainController } from 'nehubaUI/nehubaUI.services';
import { WidgetComponent } from 'nehubaUI/nehubaUI.widgets.component';

@Component({
  selector : `nehubaui-searchresult-region-list`,
  template : 
  `
  <ng-template #regionList>
    <nehubaui-searchresult-region 
      (hover)=subHover(item)
      (mouseenter)="hover(region)" 
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
  constructor(public mainController:MainController){
    
  }

  widgetComponent : WidgetComponent
  ngAfterViewInit(){
    this.widgetComponent = this.mainController.widgitiseTemplateRef(this.regionList,{name:this.title})
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }

  ngOnDestroy(){
    this.widgetComponent.parentViewRef.destroy()    
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }

  highlightedRegion : RegionDescriptor

  hover(region:RegionDescriptor){
    this.highlightedRegion = region
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
  <div class = "well">
    <div class = "well-heading">
      <span>
        {{ region.name }}
      </span>
    </div>
    <div class = "well-body">
    </div>
  </div>
  `,
  styles : [
    `
    .well
    {
      position:relative;
    }
    .well:hover
    {
      cursor:default;
    }
    .well:before
    {
      position:absolute;
      left:0px;
      top:0px;
      width:100%;
      height:100%;
      content: ' ';
    }
    .well:hover:before
    {
      background-color:rgba(128,128,128,0.1);
    }
    `
  ]
})
export class SearchResultCardRegion{
  @Input() region : RegionDescriptor
  @Output() hover : EventEmitter<any> = new EventEmitter()
}