import { Component, Input, OnChanges } from '@angular/core'
import {  DatasetInterface, ChartColor, ScaleOptionInterface, LegendInterface, TitleInterfacce } from '../chartInterfaces'

import template from './nehubaUI.line.chart.template.html'
import css from './nehubaUI.line.chart.style.css'
@Component({
  selector : `line-chart`,
  template : template,
  styles : [ css ],
})
export class NehubaLineChart implements OnChanges{
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

    // this.chartOption = {
    //   animation : false,
    //   scale : {
    //     ticks : {
    //       min : 0,
    //       stepSize : Math.ceil( this.maxY / 500 ) * 100,
    //       max : (this.maxY *= ev.deltaY > 0 ? 1.2 : 0.8 , this.maxY),
    //       showLabelBackdrop : false
    //     }
    //   }
    // }
  }

  maxY : number

  chartOption : LinearChartOptionInterface = {
    scales : {
      xAxes : [{
        gridLines : {
          color : 'rgba(128,128,128,0.5)'
        },
        ticks : {
          min : 0,
          max : 100,
          stepSize : 20,
          fontColor : 'white',
        },
        scaleLabel : {
          display : true,
          labelString : 'Receptor Density (fmol/mg protein)',
          fontColor : 'rgba(200,200,200,1.0)'
        }
      }],
      yAxes : [{
        gridLines : {
          color : 'rgba(128,128,128,0.5)'
        },
        ticks : {
          fontColor : 'white',
          beginAtZero : true,
          min : 0
        },
        scaleLabel : {
          display : true,
          labelString : 'Corticol Depth %',
          fontColor : 'rgba(200,200,200,1.0)'
        }
      }],
    },
    legend : {
      display : false
    },
    title : {
      display : true,
      text : 'Profile',
      fontColor : 'rgba(255,255,255,1.0)'
    }
  }

  chartDataset : DatasetInterface = {
    labels : [],
    datasets : []
  }
  
  ngOnChanges(){
    this.chartDataset = {
      labels : this.labels,
      datasets : this.lineDatasets
    }

    this.maxY = this.chartDataset.datasets.reduce((max,dataset)=>{
      return Math.max(
        max,
        dataset.data.reduce((max,number)=>{
          return Math.max(number,max)
        },0))
    },0)

  }
}

export interface LineDatasetInputInterface{
  label : string
  data : number[]
}

interface LinearChartOptionInterface{
  scales? : {
    xAxes? : ScaleOptionInterface[]
    yAxes? : ScaleOptionInterface[]
  }
  legend? : LegendInterface
  title? : TitleInterfacce
}