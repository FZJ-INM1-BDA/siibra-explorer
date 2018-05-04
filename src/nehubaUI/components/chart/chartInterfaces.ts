import { ChartOptions } from "chart.js";

import merge from 'lodash.merge'

export interface ScaleOptionInterface{
  type? : string
  display? : boolean
  gridLines? : GridLinesOptionInterface
  ticks? :ScaleTickOptionInterface
  scaleLabel? : ScaleLabelInterface
}

export interface GridLinesOptionInterface{
  display? : boolean
  color? : string
}

export interface ScaleTickOptionInterface{
  min? : number
  max? : number
  stepSize? : number
  backdropColor? : string
  showLabelBackdrop? : boolean
  suggestedMin? : number
  suggestedMax? : number
  beginAtZero? : boolean
  fontColor? : string
}

export interface ChartColor{
  backgroundColor? : string
  borderColor? : string
  pointBackgroundColor? : string
  pointBorderColor? : string
  pointHoverBackgroundColor? : string
  pointHoverBorderColor? : string 
}

export interface DatasetInterface{
  labels : string[] | number[]
  datasets : Dataset[]
}

export interface Dataset{
  data : number[]
  label? : string
  borderWidth? : number
  borderDash? : number[]
  fill? :string|number|boolean
  backgroundColor : string
}

export interface LegendInterface{
  display? : boolean
  labels? : {
    fontColor? : string
  }
}

export interface TitleInterfacce{
  display? : boolean
  text? : string
  fontColor? : string
}

export interface ScaleLabelInterface{
  labelString? : string
  fontColor? : string
  display? : boolean
}

export const applyOption = (defaultOption:ChartOptions,option?:Partial<ChartOptions>)=>{
  merge(defaultOption,option)
}