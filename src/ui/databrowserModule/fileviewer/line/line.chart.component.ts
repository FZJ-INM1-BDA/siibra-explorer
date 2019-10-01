import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core'
import { DatasetInterface, ChartColor, ScaleOptionInterface, LegendInterface, TitleInterfacce, applyOption, CommonChartInterface } from '../chart.interface'

import { ChartOptions, LinearTickOptions,ChartDataSets } from 'chart.js';
import { Color } from 'ng2-charts';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector : `line-chart`,
  templateUrl : './line.chart.template.html',
  styleUrls : [ 
    `./line.chart.style.css`
   ],
   exportAs: 'iavLineChart'
})
export class LineChart implements OnChanges, CommonChartInterface{

  @ViewChild('canvas') canvas: ElementRef

  /**
   * labels of each of the columns, spider web edges
   */
  @Input() labels: string[]

  /**
   * shown on the legend, different lines
   */
  @Input() lineDatasets: LineDatasetInputInterface[] = []

  /**
   * colors of the datasetes
  */
  @Input() colors: ChartColor[] = []

  @Input() options: any

  mousescroll(_ev:MouseWheelEvent){

    /**
     * temporarily disabled
    */

  }

  maxY: number

  xAxesTicks: LinearTickOptions = {
    stepSize: 20,
    fontColor: 'white'
  }
  chartOption: Partial<LineChartOption> = {
    responsive: true,
    scales: {
      xAxes: [{
        type: 'linear',
        gridLines: {
          color: 'rgba(128,128,128,0.5)'
        },
        ticks: this.xAxesTicks,
        scaleLabel: {
          display: true,
          labelString: 'X Axes label',
          fontColor: 'rgba(200,200,200,1.0)'
        }
      }],
      yAxes: [{
        gridLines: {
          color: 'rgba(128,128,128,0.5)'
        },
        ticks: {
          fontColor: 'white',
        },
        scaleLabel: {
          display: true,
          labelString: 'Y Axes label',
          fontColor: 'rgba(200,200,200,1.0)'
        }
      }],
    },
    legend: {
      display: true
    },
    title: {
      display: true,
      text: 'Title',
      fontColor: 'rgba(255,255,255,1.0)'
    },
    color: [{
      backgroundColor: `rgba(255,255,255,0.2)`
    }],
    animation :undefined,
    elements: 
    {
      point: {
        radius: 0,
        hoverRadius: 8,
        hitRadius: 4
      }
    }
    
  }

  chartDataset: DatasetInterface = {
    labels: [],
    datasets: []
  }

  shapedLineChartDatasets: ChartDataSets[]
  
  constructor(private sanitizer:DomSanitizer){
    
  }

  ngOnChanges(){
    this.shapedLineChartDatasets = this.lineDatasets.map(lineDataset=>({
      data: lineDataset.data.map((v,idx)=>({
        x: idx,
        y: v
      })),
      fill: 'origin'
    }))

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

  getDataPointString(input:any):string{
    return typeof input === 'number' || typeof input === 'string'
      ? input.toString()
      : this.getDataPointString(input.y)
  }

  public csvDataUrl: SafeUrl
  public csvTitle: string
  public imageTitle: string

  private generateDataUrl(){
    const row0 = [this.chartOption.scales.xAxes[0].scaleLabel.labelString].concat(this.chartOption.scales.yAxes[0].scaleLabel.labelString).join(',')
    const maxRows = this.lineDatasets.reduce((acc, lds) => Math.max(acc, lds.data.length), 0)
    const rows = Array.from(Array(maxRows)).map((_,idx) => [idx.toString()].concat(this.shapedLineChartDatasets.map(v => v.data[idx] ? this.getDataPointString(v.data[idx]) : '').join(','))).join('\n')
    const csvData = `${row0}\n${rows}`

    this.csvDataUrl = this.sanitizer.bypassSecurityTrustUrl(`data:text/csv;charset=utf-8,${csvData}`)
    this.csvTitle = `${this.getGraphTitleAsString().replace(/\s/g, '_')}.csv`

    this.imageTitle = `${this.getGraphTitleAsString().replace(/\s/g, '_')}.png`
  }

  private getGraphTitleAsString():string{
    try{
      return this.chartOption.title.text.constructor === Array
        ? (this.chartOption.title.text as string[]).join(' ')
        : this.chartOption.title.text as string
    }catch(e){
      return `Untitled`
    }
  }

  get graphTitleAsString():string{
    try{
      return this.chartOption.title.text.constructor === Array
        ? (this.chartOption.title.text as string[]).join(' ')
        : this.chartOption.title.text as string
    }catch(e){
      return `Untitled`
    }
  }
}


export interface LineDatasetInputInterface{
  label?: string
  data: number[]
}

export interface LinearChartOptionInterface{
  scales?: {
    xAxes?: ScaleOptionInterface[]
    yAxes?: ScaleOptionInterface[]
  }
  legend?: LegendInterface
  title?: TitleInterfacce
  color?: Color[]
}

interface LineChartOption extends ChartOptions{
  color?: Color[]
}
