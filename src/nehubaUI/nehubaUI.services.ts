import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx'

import { TemplateDescriptor, LabComponent, RegionDescriptor } from './nehuba.model'
import { NehubaModalService } from './nehubaUI.modal.component'

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
    static sLoadPlugin : (labComponent : LabComponent)=>void
    static sFindRegion : (id : Number|null) => RegionDescriptor | null
}

let metadata : any = {}

export const EXTERNAL_CONTROL = window['nehubaUI'] = {
    viewControl : new Subject(),
    metadata : metadata
}

class UIHandle{
    onTemplateSelection : (cb:()=>void)=>void
    afterTemplateSelection : (cb:()=>void)=>void
    onParcellationSelection : (cb:()=>void)=>void
    afterParcellationSelection : (cb:()=>void)=>void
    modalControl : NehubaModalService
}

export const UI_CONTROL = window['uiHandle'] = new UIHandle()

class ViewerHandle {
    loadTemplate : (TemplateDescriptor:TemplateDescriptor)=>void

    onViewerInit : (cb:()=>void)=>void
    afterViewerInit : (cb:()=>void)=>void
    onViewerDestroy : (cb:()=>void)=>void

    setNavigationLoc : (loc:number[],realSpace?:boolean)=>void
    setNavigationOrientation : (ori:number[])=>void

    moveToNavigationLoc : (loc:number[],realSpace?:boolean)=>void

    showSegment : (segId:number)=>void
    hideSegment : (segId:number)=>void
    showAllSegments : ()=>void
    hideAllSegments : ()=>void

    loadLayer : (layerObj:Object)=>void
    reapplyNehubaMeshFix : ()=>void

    mouseEvent : Subject<{eventName:string,event:any}>
    mouseOverNehuba : Subject<{nehubaOutput : any, foundRegion : RegionDescriptor | null}>
}

export const VIEWER_CONTROL = window['viewerHandle'] = new ViewerHandle()


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

export const PRESET_COLOR_MAPS = 
    [{
          name : 'MATLAB_autumn',
          previewurl : "http://http://172.104.156.15:8080/colormaps/MATLAB_autumn.png",
          code : `vec4 colormap(float x) {float g = clamp(x,0.0,1.0);return vec4(1.0,g,0.0,1.0);}`
    },{
          name : 'MATLAB_bone',
          previewurl : 'http://http://172.104.156.15:8080/colormaps/MATLAB_bone.png',
          code : `float colormap_red(float x) {  if (x < 0.75) {      return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;  } else {      return (13.0 + 8.0 / 9.0) / 10.0 * x - (3.0 + 8.0 / 9.0) / 10.0;  }}float colormap_green(float x) {  if (x <= 0.375) {      return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;  } else if (x <= 0.75) {      return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 100.0;  } else {      return 8.0 / 9.0 * x + 1.0 / 9.0;  }}float colormap_blue(float x) {  if (x <= 0.375) {      return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 1000.0;  } else {      return 8.0 / 9.0 * x + 1.0 / 9.0;  }}vec4 colormap(float x) {  float r = clamp(colormap_red(x),0.0,1.0);  float g = clamp(colormap_green(x), 0.0, 1.0);  float b = clamp(colormap_blue(x), 0.0, 1.0);  return vec4(r, g, b, 1.0);}          `
    }]

export const CM_MATLAB_HOT = `float r=clamp(8.0/3.0*x,0.0,1.0);float g=clamp(8.0/3.0*x-1.0,0.0,1.0);float b=clamp(4.0*x-3.0,0.0,1.0);`
export const TIMEOUT = 5000;
export const CM_THRESHOLD = 0.01;
export const PMAP_WIDGET = {
    name : `PMap`,
    icon : 'picture',
    script : `
    (()=>{
        window.nehubaViewer.ngviewer.layerManager.getLayerByName('PMap').setVisible(true)
        const encodedValue = document.getElementById('default.default.pmap.encodedValue')
        window.nehubaViewer.mouseOver.image.filter(ev=>ev.layer.name=='PMap').subscribe(ev=>encodedValue.innerHTML = (!ev.value || ev.value == 0) ? '' : Math.round(ev.value * 1000)/1000)
        window.pluginControl['PMap'].onShutdown(()=>{
            window.nehubaViewer.ngviewer.layerManager.getLayerByName('PMap').setVisible(false)
            window.viewerHandle.hideSegment(0)
        })
    })()
    `,
    template : `
    <table class = "table table-sm table-bordered">
        <tbody>
            <tr>
                <td>Heat Map</td>
            </tr>
            <tr>
                <td><img class="col-md-12" src="http://172.104.156.15:8080/colormaps/MATLAB_hot.png"></td>
            </tr>
            <tr>
                <td>
                    <table class = "table table-sm table-bordered">
                        <tbody>
                            <tr>
                                <td class = "col-sm-6">Encoded Value</td>
                                <td class = "col-sm-6" id = "default.default.pmap.encodedValue"></td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td>Close this dialogue to resume normal browsing.</td>
            </tr>
        </tbody>
    </table>
    `
}