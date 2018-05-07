import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core'

import template from './nehubaUI.radar.chart.template.html'
import css from './nehubaUI.radar.chart.style.css'
import { DatasetInterface, ChartColor, ScaleOptionInterface, TitleInterfacce, LegendInterface, applyOption } from 'nehubaUI/components/chart/chartInterfaces';
import { Color } from 'ng2-charts';
@Component({
  selector : `radar-chart`,
  template : template,
  styles : [ css ],
})
export class NehubaRadarChart implements OnChanges{

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
        fontColor : 'white'
      },
      angleLines : {
        color : 'rgba(128,128,128,0.2)'
      },
      pointLabels : {
        fontColor : 'white'
      }
    },
    legend : {
      display: true,
      labels : {
        fontColor : 'white'
      }
    },
    title :{
      text : 'Radar graph',
      display : true,
      fontColor : 'rgba(255,255,255,1.0)'
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
    // this.colors = [
    //   {
    //     borderColor : 'rgba(255,255,255,1)'
    //   },
    //   {
    //     borderColor : ' rgba(255,255,255,1)',
    //   }
    // ]

    // console.log(this.chartDataset)
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