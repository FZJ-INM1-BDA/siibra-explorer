import { Component, Input, OnChanges } from '@angular/core'

import template from './nehubaUI.radar.chart.template.html'
import css from './nehubaUI.radar.chart.style.css'
import { DatasetInterface, ChartColor, ScaleOptionInterface, TitleInterfacce, LegendInterface } from 'nehubaUI/components/chart/chartInterfaces';
@Component({
  selector : `radar-chart`,
  template : template,
  styles : [ css ],
})
export class NehubaRadarChart implements OnChanges{
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

  mousescroll(ev:MouseWheelEvent){
    // this.chartOption.scale!.ticks!.stepSize = 
    // this.chartOption.scale!.ticks!.max = ( , this.maxY)

    this.maxY *= ev.deltaY > 0 ? 1.2 : 0.8
    const newTicksObj = {
      stepSize : Math.ceil( this.maxY / 500 ) * 100,
      max : this.maxY
    }

    const combineTicksObj = Object.assign({},this.chartOption.scale!.ticks,newTicksObj)
    const combineScale = Object.assign({},this.chartOption.scale,{ticks:combineTicksObj})
    this.chartOption = Object.assign({},this.chartOption,{scale : combineScale,animation : false})
    // this.chartOption = Object.assign({},this.chartOption,{

    // })

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
      text : 'Fingerprint',
      display : true,
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
      datasets : this.radarDatasets
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

export interface RadarDatasetInputInterface{
  label : string
  data : number[]
}

interface RadarChartOptionInterface{
  scale? : ScaleOptionInterface&RadarScaleOptionAdditionalInterface
  animation? : any
  legend? : LegendInterface
  title? : TitleInterfacce
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