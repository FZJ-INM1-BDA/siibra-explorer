import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewInit, AfterViewChecked } from '@angular/core'

import { DatasetInterface, ChartColor, ScaleOptionInterface, TitleInterfacce, LegendInterface, applyOption } from '../chart.interface';
import { Color } from 'ng2-charts';
import {DatabrowserService} from "src/ui/databrowserModule/databrowser.service";
@Component({
  selector : `radar-chart`,
  templateUrl : './radar.chart.template.html',
  styleUrls : [ 
    `./radar.chart.style.css`
   ],
})
export class RadarChart implements OnChanges{

  @ViewChild('canvas') canvas : ElementRef
  /**
   * labels of each of the columns, spider web edges
   */
  @Input() labels : string[] = []

  /**
   * shown on the legend, different lines
   */
  @Input() radarDatasets : RadarDatasetInputInterface[] = []

  /**
   * colors of the datasetes
  */
  @Input() colors : ChartColor[] = []

  @Input() options : any

  constructor(private dbService: DatabrowserService) {}

  get darktheme(){
    return this.dbService.darktheme
  }

  mousescroll(_ev:MouseWheelEvent){

    /**
     * mouse wheel zooming disabled for now
     */
    /**
     * TODO the sroll up event sometimes does not get prevented for some reasons...
     */

    // ev.stopPropagation()
    // ev.preventDefault()

    // this.maxY *= ev.deltaY > 0 ? 1.2 : 0.8
    // const newTicksObj = {
    //   stepSize : Math.ceil( this.maxY / 500 ) * 100,
    //   max : this.maxY
    // }

    // const combineTicksObj = Object.assign({},this.chartOption.scale!.ticks,newTicksObj)
    // const combineScale = Object.assign({},this.chartOption.scale,{ticks:combineTicksObj})
    // this.chartOption = Object.assign({},this.chartOption,{scale : combineScale,animation : false})
  }

  maxY : number

  chartOption : RadarChartOptionInterface = {
    scale : {
      gridLines : {
        color : 'rgba(128,128,128,0.5)'
      },
      ticks : {
        showLabelBackdrop : false,
        fontColor : this.darktheme? 'white' : 'black'
      },
      angleLines : {
        color : 'rgba(128,128,128,0.2)'
      },
      pointLabels : {
        fontColor : this.darktheme? 'white' : 'black'
      }
    },
    legend : {
      display: true,
      labels : {
        fontColor : this.darktheme? 'white' : 'black'
      }
    },
    title :{
      text : 'Radar graph',
      display : true,
      fontColor : this.darktheme? 'rgba(255,255,255,1.0)' : 'black'
    },
    color : [{
      backgroundColor : `rgba(255,255,255,0.2)`
    }],
    animation : false
  }

  chartDataset : DatasetInterface = {
    labels : [],
    datasets : []
  }

  
  ngOnChanges(){
    this.chartDataset = {
      labels : this.labels,
      datasets : this.radarDatasets.map(ds=>Object.assign({},ds,{backgroundColor : 'rgba(255,255,255,0.2)'}))
    }
    // this.chartDataset.datasets[0]

    this.maxY = this.chartDataset.datasets.reduce((max,dataset)=>{
      return Math.max(
        max,
        dataset.data.reduce((max,number)=>{
          return Math.max(number,max)
        },0))
    },0)

    applyOption(this.chartOption,this.options)
  }
}

export interface RadarDatasetInputInterface{
  label : string
  data : number[]
}

export interface RadarChartOptionInterface{
  scale? : ScaleOptionInterface&RadarScaleOptionAdditionalInterface
  animation? : any
  legend? : LegendInterface
  title? : TitleInterfacce
  color? :Color[]
}

interface RadarScaleOptionAdditionalInterface{
  angleLines? :AngleLineInterface
  pointLabels?:PointLabelInterface
}

interface AngleLineInterface{
  display? : boolean
  color? : string
  lineWidth? : number
}

interface PointLabelInterface{
  fontColor? : string
}