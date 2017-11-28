import { DecimalPipe } from '@angular/common'
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx'

import { TemplateDescriptor, LabComponent } from './nehuba.model'

declare var window:{
    [key:string] : any
    prototype : Window;
    new() : Window;
}


@Injectable()
export class DataService {

    /* simiple fetch promise for json obj */
    /* nb: return header must contain Content-Type : application/json */
    /* nb: return header must container CORS header */
    /* or else an error will be thrown */

    fetchJson(url:string):Promise<any>{
        return Promise.race([
            fetch( url )
                .then( response =>{
                    return response.json()
                })
                .then(json => {
                    return json
                }),
            new Promise((_,reject)=>{
                setTimeout(()=>{
                    reject('fetch request did not receive any response. Timeout after '+TIMEOUT+'ms')
                },TIMEOUT)
            })
        ])
    }

    parseTemplateData(json:any):Promise<TemplateDescriptor>{
        return new Promise((resolve,_)=>{
            resolve(new TemplateDescriptor(json))
        })
    }

    parseJson(json:any){
        switch(json.type){
            // case 'template':{
            //     this.inputResponse += 'Adding new Template. '
            //     this.nehubaFetchData.parseTemplateData(json)
            //         .then( template =>{
            //             this.fetchedOutputToController(template)
            //         })
            //         .catch( e=>{
            //             this.inputResponse += 'Error.'
            //             this.inputResponse += e.toString()
            //             console.log(e)
            //         })
            // }break;
            // case 'parcellation':{
                
            // }break;
            // case 'plugin':{
            //     /* some sort of validation process? */
            //     this.inputResponse += 'Adding new plugin.'
            //     const newPlugin = new PluginDescriptor(json)
            //     this.fetchedOutputToController(newPlugin)
            // }break;
            // default:{
            //     this.inputResponse += '\'type\' field not found.. Unable to process this JSON.'
            // }break;
        }
    }
}

/** usage
 * 1) construct a new animation object with duration and (in the future) method
 * 2) use call generate() to return an iterator
 * 3) use requestanimationframe to get an object in the form of {value:number,done:boolean}
 * 4) number traverse from 0 - 1 corresponding to the fraction of animation completed
 * 
 * nb: do not inject. Start new instance each time. startTime is needed for each Animation.
 */
export class Animation{

    duration:number
    method:string
    startTime : number

    constructor(duration:number,method:string){
        this.duration = duration
        this.method = method
        this.startTime = Date.now()
    }

    *generate():IterableIterator<number>{
        while(( Date.now() - this.startTime ) / this.duration < 1 ){
            yield ( Date.now() - this.startTime ) / this.duration
        }
        return 1
    }
}

export class HelperFunctions{
    
    queryJsonSubset(query:any,obj:any):boolean{
        if(query==={}){
            return true
        }
        if(query.constructor.name !== 'Object') {
            return query == obj
        }
        return Object.keys(query).every(key=>
            obj[key] ? this.queryJsonSubset(query[key],obj[key]) : false)
    }

    queryNestedJsonValue(query:any,obj:any):any{
        const key = Object.keys(query)[0]
        return query[key].constructor.name === 'Object' ? 
            this.queryNestedJsonValue(query[key],obj[key]?obj[key]:({})) :
            ({target: query[key],value:obj[key]?obj[key]:({})});
    }

    setValueById(id:string,obj:any,value:string){
        switch( obj.constructor.name ){
            case 'Object':
            case 'Array':{
                for (let idx in obj){
                    if( obj[idx]._activeCell ){
                        if( obj[idx]._id && obj[idx]._id == id.replace(/\s/g,'').split('|')[0] ) {
                            let transformed_value = value
                            id.replace(/\s/g,'').split('|').forEach((pipe,idx)=>{
                                if( idx == 0 ){
                                    /* target id */
                                }else{
                                    /* more pipes to be introduced */
                                    if( /number/.test(pipe) ){
                                        if( value.constructor.name === 'Object' ){
                                            transformed_value = "0.0000"
                                        }else{
                                            let transform = new DecimalPipe('en-US').transform(value,pipe.replace(/number|\'|\"|\:/gi,''))
                                            transformed_value = transform ? transform! : "0.0000"
                                        }
                                    }
                                }
                            })
                            obj[idx]._value = transformed_value
                        }
                    } else {
                        this.setValueById(id,obj[idx],value)
                    }
                }
            }break;
        }
    }

    loadPlugin : (labComponent : LabComponent) =>void
}

let metadata : any = {}

export const EXTERNAL_CONTROL = window['nehubaUI'] = {
    viewControl : new Subject(),
    util : {
        modalControl : {}
    },
    metadata : metadata,
    mouseEvent : new Subject()
}

class UIHandle{
    onTemplateSelection : (cb:()=>void)=>void
    afterTemplateSelection : (cb:()=>void)=>void
    onParcellationSelection : (cb:()=>void)=>void
    afterParcellationSelection : (cb:()=>void)=>void
}

export const UI_CONTROL = new UIHandle()

class ViewerHandle {
    loadTemplate : (TemplateDescriptor:TemplateDescriptor)=>void

    onViewerInit : (cb:()=>void)=>void
    afterViewerInit : (cb:()=>void)=>void
    onParcellationLoading : (cb:()=>void)=>void
    afterParcellationLoading : (cb:()=>void)=>void
    onViewerDestroy : (cb:()=>void)=>void

    setNavigationLoc : (loc:number[],realSpace?:boolean)=>void
    setNavigationOrientation : (ori:number[])=>void

    moveToNavigationLoc : (loc:number[],realSpace?:boolean)=>void

    showSegment : (segId:number)=>void
    hideSegment : (segId:number)=>void
    showAllSegments : ()=>void
    hideAllSegments : ()=>void
}

export const VIEWER_CONTROL = new ViewerHandle()


export const HELP_MENU = {
    'Mouse Controls' : {
        "Left-drag" : "within a slice view to move within that plane",
        "Shift + Left-drag" : "within a slice view to change the rotation of the slice views",
        "Mouse-Wheel" : "up or down to zoom in and out.",
        "Ctrl + Mouse-Wheel" : "moves the navigation forward and backward",
        "Ctrl + Right-click" : "within a slice to teleport to that location"
        },
        'Keyboard Controls' : {
        "tobe":"completed"
        }
}

export const PRESET_COLOR_MAPS = [
    {
          name : 'MATLAB_autumn',
          previewurl : "http://http://172.104.156.15:8080/colormaps/MATLAB_autumn.png",
          code : `
vec4 colormap(float x) {
  float g = clamp(x,0.0,1.0);
  return vec4(1.0,g,0.0,1.0);
}
          `
    },
     {
          name : 'MATLAB_bone',
          previewurl : 'http://http://172.104.156.15:8080/colormaps/MATLAB_bone.png',
          code : `
float colormap_red(float x) {
  if (x < 0.75) {
      return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;
  } else {
      return (13.0 + 8.0 / 9.0) / 10.0 * x - (3.0 + 8.0 / 9.0) / 10.0;
  }
}

float colormap_green(float x) {
  if (x <= 0.375) {
      return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;
  } else if (x <= 0.75) {
      return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 100.0;
  } else {
      return 8.0 / 9.0 * x + 1.0 / 9.0;
  }
}

float colormap_blue(float x) {
  if (x <= 0.375) {
      return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 1000.0;
  } else {
      return 8.0 / 9.0 * x + 1.0 / 9.0;
  }
}

vec4 colormap(float x) {
  float r = clamp(colormap_red(x),0.0,1.0);
  float g = clamp(colormap_green(x), 0.0, 1.0);
  float b = clamp(colormap_blue(x), 0.0, 1.0);
  return vec4(r, g, b, 1.0);
}
          `
    }
]

export const CM_MATLAB_HOT = `float r=clamp(8.0/3.0*x,0.0,1.0);float g=clamp(8.0/3.0*x-1.0,0.0,1.0);float b=clamp(4.0*x-3.0,0.0,1.0);`
export const TIMEOUT = 5000;
export const CM_THRESHOLD = 0.01;