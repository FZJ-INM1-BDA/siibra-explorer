import { Component, AfterViewInit, Input, ViewChild, ViewContainerRef } from "@angular/core";
import { showLandmarkHeight, translateLandmarkHeight } from "nehubaUI/util/nehubaUI.util.animations";
import { Landmark } from "nehubaUI/nehuba.model";
import { LandmarkServices } from "nehubaUI/nehubaUI.services";

import template from './nehubaUI.viewer.2dlandmark.template.html'
import css from './nehubaUI.viewer.2dlandmark.style.css'

@Component({
  selector : `nehuba-viewer-2d-landmark-unit`,
  template : template,
  styles :[ css ],
  animations : [ showLandmarkHeight,translateLandmarkHeight ]
})

export class NehubaViewer2DLandmarkUnit implements AfterViewInit{

  @Input() height : number
  @Input() scale : number = 50
  @Input() landmark:Landmark
  @ViewChild('nodeView',{read:ViewContainerRef}) nodeView : ViewContainerRef

  constructor(private landmarkServices:LandmarkServices){

  }

  ngAfterViewInit(){
    this.landmarkServices.onChangeLandmarkNodeView((landmark,view)=>{
      if(landmark.id == this.landmark.id){
        this.nodeView.createEmbeddedView(view)
      }
    })
  }

  styleNode(){
    if(this.height){
      return({
        'color' : `rgb(${this.landmark.hover ? HOVER_COLOR : NORMAL_COLOR})`,
        'z-index' : this.height >= 0 ? 0 : -2
      })
    }else{
      return({
        display:'none'
      })
    }
  }

  styleLandmark(){
    // if(this.height){
      
    //   return this.height >= 0 ? 
    //     ({
    //       'flex-direction':`column`,
    //       'font-size':`${this.scale * 3.0}%`,
    //       'color' : `rgba(${this.landmark.hover ? HOVER_COLOR :NORMAL_COLOR},${this.scale/100+0.25})`,
    //       'background-color' : `rgba(${this.landmark.hover ?  HOVER_COLOR : NORMAL_COLOR},${this.scale/100+0.25})`,

    //     }) : ({
    //       'flex-direction':`column-reverse`,
    //       'font-size':`${this.scale * 3.0}%`,
    //       'color' : `rgba(${this.landmark.hover ? HOVER_COLOR : NORMAL_COLOR},${this.scale/100+0.25})`,
    //       'background-color' : `rgba(${this.landmark.hover ? HOVER_COLOR : NORMAL_COLOR},${this.scale/100+0.25})`,
    //     })

    // } else {
    //   return({
    //     display:'none'
    //   })
    // }
  }

  calcOpacityFlatMode():number{
    return this.landmark.hover ? 1.0 : 10 / (Math.abs(this.height) + 10)
  }

  calcOpacity():number{
    return this.landmarkServices.flatProjection ? 
      this.calcOpacityFlatMode() :
        this.height >= 0 ? 
          1 :
          0.4 
  }

  styleShadow(){
    if(this.height){
      // const size = (0.4/(0.4*Math.pow(this.height/30,2) + 1) + 0.1)*10
      return ({
        'background':`radial-gradient(
          circle at center,
          rgba(${this.landmark.hover ? HOVER_COLOR + ',0.3' : NORMAL_COLOR + ',0.3'}) 10%, 
          rgba(${this.landmark.hover ? HOVER_COLOR + ',0.8' : NORMAL_COLOR + ',0.8'}) 30%,
          rgba(0,0,0,0.8))`,
        'transform' : `scale(5,5)`
      })
    }else{
      return ({display:`none`})
    }
    // if(this.height){
      
    //   const returnStyle = {
    //     display : 'block',
    //     background:'radial-gradient(rgba(120,60,30,0.8), rgba(120,60,30,0.3))',
    //   }
    //   return this.height >= 0 ?
    //     Object.assign({},returnStyle,{
    //       'width' : `${size}em`,
    //       'height' : `${size}em`,
    //       'border-radius' : `${size/2}em`,
    //       'margin-top' : `${-1*size/2}em`,
    //       'margin-left' : `${-1*size/2}em`,
    //     }) : 
    //     Object.assign({},returnStyle,{
    //       'width' : `${size}em`,
    //       'height' : `${size}em`,
    //       'border-radius' : `${size/2}em`,
    //       'margin-top' : `${-1*size/2}em`,
    //       'margin-left' : `${-1*size/2}em`,
    //       'border': `1px solid rgba(0,0,0,1.0)`,
    //       'background':`radial-gradient(rgba(${this.landmark.hover ? HOVER_COLOR + ',0.4' : NORMAL_COLOR + ',0.4'}), rgba(${this.landmark.hover ? HOVER_COLOR + ',0.15' : NORMAL_COLOR + ',0.15'}))`,
    //     })
    // }else{
    //   return({
    //     display:'none'
    //   })
    // }
  }

  styleBeam(){
    return this.height ? 
      ({
        transform : `translate(0px,${-this.height/2}px) scale(1,${this.height})`
      }) : 
        ({
          display:`none`
        })
  }

  styleBeamDashedColor(){
    return({
      'border-left-color' :`rgba(${this.landmark.hover ? HOVER_COLOR + ',0.8' : NORMAL_COLOR + ',0.8'})` 
    })
  }

  styleBeamColor(inner:boolean){
    return inner ? ({
      transform : `scale(1.0,1.0)`,
      'border-top-color' : `rgba(${this.landmark.hover ? HOVER_COLOR + ',0.8' : NORMAL_COLOR + ',0.8'})`
    }) : ({
      transform : `scale(1.5,1.0)`,
      'border-top-color' : 'rgb(0,0,0)'
    })
  }

  // styleBeam(inner:boolean){
  //   if(this.height){
  //     // const borderWidth = 1

  //     return this.height >= 0 ? 
  //       ({
  //         // 'border-top' : `${this.height+(inner?0:2)}px solid rgba(${inner ? this.landmark.hover ? HOVER_COLOR :NORMAL_COLOR : '0,0,0'},0.75)`,
  //         // 'border-left' : `${borderWidth+(inner?0:1)}px solid transparent`,
  //         // 'border-right' : `${borderWidth+(inner?0:1)}px solid transparent`,
  //         'width' : `4px`,
  //         // 'left':`${-1*(borderWidth+(inner?0:1))}px`,
  //         'transform':`scale(1,${this.height})`,
  //       }) : 
  //       inner ? 
  //         ({
  //           // 'border-left' : `1px dashed rgba(${this.landmark.hover ? HOVER_COLOR :NORMAL_COLOR},1.0)`,
  //           // 'border-right' : `1px solid transparent`,
  //           'width' : `2px`,
  //           'transform':`scale(1,${this.height})`
  //         }) : 
  //         ({

  //         })

  //   }else{
  //     return({
  //       display:'none'
  //     })
  //   }
    
    // if(this.height){
      
    //   return this.height >= 0 ? 
    // }else{
    //   return({
    //     display:'none'
    //   })
    // }
    // }
}

const NORMAL_COLOR : string = '201,54,38'
const HOVER_COLOR : string = '250,150,80'