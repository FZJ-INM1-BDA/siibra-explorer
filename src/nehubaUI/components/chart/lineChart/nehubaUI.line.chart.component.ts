import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core'
import {  DatasetInterface, ChartColor, ScaleOptionInterface, LegendInterface, TitleInterfacce, applyOption } from '../chartInterfaces'

import template from './nehubaUI.line.chart.template.html'
import css from './nehubaUI.line.chart.style.css'
import { ChartOptions, LinearTickOptions,ChartDataSets } from 'chart.js';
import { Color } from 'ng2-charts';
@Component({
  selector : `line-chart`,
  template : template,
  styles : [ css ],
})
export class NehubaLineChart implements OnChanges{
  @ViewChild('canvas') canvas : ElementRef

  /**
   * labels of each of the columns, spider web edges
   */
  @Input() labels : string[]

  /**
   * shown on the legend, different lines
   */
  @Input() lineDatasets : LineDatasetInputInterface[] = []

  /**
   * colors of the datasetes
  */
  @Input() colors : ChartColor[] = []

  @Input() options : any

  mousescroll(_ev:MouseWheelEvent){

    /**
     * temporarily disabled
    */

  }

  maxY : number

  xAxesTicks : LinearTickOptions = {
    stepSize : 20,
    fontColor : 'white'
  }
  chartOption : ChartOptions = {
    scales : {
      xAxes : [{
        type : 'linear',
        gridLines : {
          color : 'rgba(128,128,128,0.5)'
        },
        ticks : this.xAxesTicks,
        scaleLabel : {
          display : true,
          labelString : 'X Axes label',
          fontColor : 'rgba(200,200,200,1.0)'
        }
      }],
      yAxes : [{
        gridLines : {
          color : 'rgba(128,128,128,0.5)'
        },
        ticks : {
          fontColor : 'white',
        },
        scaleLabel : {
          display : true,
          labelString : 'Y Axes label',
          fontColor : 'rgba(200,200,200,1.0)'
        }
      }],
    },
    legend : {
      display : true
    },
    title : {
      display : true,
      text : 'Title',
      fontColor : 'rgba(255,255,255,1.0)'
    },
    elements : 
    {
      point : {
        radius : 0,
        hoverRadius : 8,
        hitRadius : 4
      }
    }
    
  }

  chartDataset : DatasetInterface = {
    labels : [],
    datasets : []
  }

  shapedLineChartDatasets : ChartDataSets[]
  
  ngOnChanges(){
    this.shapedLineChartDatasets = this.lineDatasets.map(lineDataset=>({
      data : lineDataset.data.map((v,idx)=>({
        x : idx,
        y : v
      })),
      fill : 'origin'
    }))
    
    this.maxY = this.chartDataset.datasets.reduce((max,dataset)=>{
      return Math.max(
        max,
        dataset.data.reduce((max,number)=>{
          return Math.max(number,max)
        },0))
    },0)

    applyOption(this.chartOption,this.options)

    // this.colors = 
    // this.colors = [{
    //     backgroundColor : 'rgba(0,255,0,0.2)'
    //   }]
  }
}


export interface LineDatasetInputInterface{
  label? : string
  data : number[]
}

export interface LinearChartOptionInterface{
  scales? : {
    xAxes? : ScaleOptionInterface[]
    yAxes? : ScaleOptionInterface[]
  }
  legend? : LegendInterface
  title? : TitleInterfacce
  color? : Color[]
}