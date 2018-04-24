import { Component, Input, OnChanges, ComponentFactory, TemplateRef } from '@angular/core'
import { DatasetInterface, RegionDescriptor } from 'nehubaUI/nehuba.model';
import { RadarChartOptionInterface } from 'nehubaUI/components/chart/radarChart/nehubaUI.radar.chart.component';
import { LinearChartOptionInterface } from 'nehubaUI/components/chart/lineChart/nehubaUI.line.chart.component';
import { Dataset } from 'nehubaUI/components/chart/chartInterfaces';


import template from './searchResultUI.template.html'
import css from './searchResultUI.style.css'
import { MainController, WidgitServices } from 'nehubaUI/nehubaUI.services';
import { FileViewer } from 'nehubaUI/mainUI/fileViewer/fileViewer.component';


@Component({
  selector : 'nehubaui-searchresult-ui',
  template : template,
  styles : [ css ]
})

export class SearchResultUI implements OnChanges{
  @Input() searchResult : SearchResultInterface
  associatedRegions : RegionDescriptor[]

  fileViewerFactory : ComponentFactory<FileViewer>
  constructor(public mainController:MainController,public widgetService:WidgitServices){
    
  }

  popupFileViewer(file:SearchResultFileInterface,template:TemplateRef<any>){
    // console.log(file,template)

    const widgetComponent = this.widgetService.widgitiseTemplateRef(template,{name:`default.default.${file.name}`,onShutdownCleanup:()=>{widgetComponent.parentViewRef.destroy()}})
    widgetComponent.changeState('floating')
  }

  ngOnChanges(){

    this.name = this.searchResult.name
    this.thumbnail = this.searchResult.thumbnail

    /* TODO unify naming of the key */
    this.property = this.searchResult.properties
    this.files = this.searchResult.files

    const arrayRegion = Array.from(this.mainController.regionsLabelIndexMap.values())

    this.regionLinks = this.searchResult.regionName ? 
      /* temporary measure to be changed as soon as the data structure changes */
      this.searchResult.regionName.reduce((acc,el)=>{
        const foundRegion = arrayRegion.find(r=>r.name==el.regionName)
        return typeof foundRegion == 'undefined' ? 
          acc : 
          acc.concat(new RegionLinkClass(foundRegion,el.relationship,el.moreInfo))
      },[] as RegionLinkClass[]) :
      []
  }
  name : string
  thumbnail? : SearchResultFileInterface
  property : Partial<DatasetInterface>
  files : SearchResultFileInterface[]

  regionLinks : RegionLinkClass[]
}

export class RegionLinkClass{
  region? : RegionDescriptor 
  relationship? : string //'equals' | 'is subset of' | 'is superset of'
  moreInfo? : string //describing the relationship (dosal anterior, etc)

  constructor(region:RegionDescriptor,relationship?:string,moreInfo?:string){
    /* TODO temporary measure, need to fix with proper structure */

    this.region = region
    this.relationship = relationship
    this.moreInfo = moreInfo
  }
}

export interface SearchResultInterface{
  name : string,

  thumbnail? : SearchResultFileInterface

  /**
   * region name should be reworded... somehow
   */
  regionName? : ({
    regionName : string
    relationship : string
    moreInfo : string
  })[]

  properties : Partial<DatasetInterface>
  files : SearchResultFileInterface[]

  highlight :  boolean
}

export interface SearchResultFileInterface{
  name : string
  mimtetype : string
  properties : Partial<DatasetInterface>
  data? : ChartInterface
  url? : string
}

interface ChartInterface{
  chartType : 'line' | 'radar'
  chartOptions : RadarChartOptionInterface | LinearChartOptionInterface
  labels : string[]
  datasets : Dataset[]
}