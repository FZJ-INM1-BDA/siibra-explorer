import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core'

import { DatasetInterface, ChartColor, ScaleOptionInterface, TitleInterfacce, LegendInterface, applyOption, CommonChartInterface } from '../chart.interface';
import { Color } from 'ng2-charts';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { RadialChartOptions } from 'chart.js'

@Component({
  selector : `radar-chart`,
  templateUrl : './radar.chart.template.html',
  styleUrls : [ 
    `./radar.chart.style.css`
   ],
   exportAs: 'iavRadarChart'
})
export class RadarChart implements OnChanges, CommonChartInterface{

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

  chartOption : Partial<RadialChartOptions> = {
    responsive: true,
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
    animation: null
  }

  chartDataset : DatasetInterface = {
    labels : [],
    datasets : []
  }

  constructor(private sanitizer: DomSanitizer){

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

    this.generateDataUrl()
  }

  public csvDataUrl: SafeUrl
  public csvTitle: string
  public imageTitle: string

  private generateDataUrl(){
    const row0 = ['Receptors', ...this.chartDataset.datasets.map(ds => ds.label || 'no label')].join(',')
    const otherRows = (this.chartDataset.labels as string[])
      .map((label, index) => [ label, ...this.chartDataset.datasets.map(ds => ds.data[index]) ].join(',')).join('\n')
    const csvData = `${row0}\n${otherRows}`

    this.csvDataUrl = this.sanitizer.bypassSecurityTrustUrl(`data:text/csv;charset=utf-8,${csvData}`)
    this.csvTitle = `${this.getGraphTitleAsString().replace(/\s/g, '_')}.csv`

    this.imageTitle = `${this.getGraphTitleAsString().replace(/\s/g, '_')}.png`
  }

  private getGraphTitleAsString():string{
    try{
      return this.chartOption.title.text as string
    }catch(e){
      return `Untitled`
    }
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