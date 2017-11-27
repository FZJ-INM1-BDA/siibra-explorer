import { DecimalPipe } from '@angular/common'
import { Injectable } from '@angular/core';
// import { vec4 } from 'neuroglancer/util/geom'
// import { Config as NehubaConfig } from 'nehuba/exports'
import { Subject,BehaviorSubject } from 'rxjs/Rx'

import { TemplateDescriptor,EventPacket } from './nehuba.model'
import { TIMEOUT } from './nehuba.config'

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

    /* takes a value and generates a value that is somewhat close to the original value every time */
    *randomSteps(oldValue:number):IterableIterator<number>{
        do{
            yield (oldValue + Math.random()) / 5
            /* too new age for my liking */
            // yield Math.abs( (oldValue + ( Math.random() - 0.5 )/5 ) %1 )
        }while(true)
    }
}

export class EventCenter{
    modalSubjectBroker : Subject<Subject<EventPacket>> = new Subject()
    floatingWidgetSubjectBroker : Subject<Subject<EventPacket>> = new Subject()

    nehubaViewerRelay : Subject<EventPacket> = new Subject()
    globalLayoutRelay : BehaviorSubject<EventPacket> = new BehaviorSubject(new EventPacket(EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME,'',100,{theme:'light'}))

    userViewerInteractRelay : Subject<EventPacket> = new Subject()

    /* returns a new Subject to the function's caller
     * in the future, also sends the subject to the right service
     * so the caller and the right service can have a single channel
     */
    createNewRelay(evPk:EventPacket):Subject<EventPacket>{
        switch (evPk.target){
            case 'floatingWidgetRelay':{
                let newSubject : Subject<EventPacket> = new Subject()
                this.floatingWidgetSubjectBroker.next(newSubject)
                return newSubject
            }
            case 'curtainModal':{
                let newSubject : Subject<EventPacket> = new Subject()
                this.modalSubjectBroker.next(newSubject)
                return newSubject
            }
            default:{
                return new Subject()
            }
        }
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
}

let metadata : any = {}

export const EXTERNAL_CONTROL = window['nehubaUI'] = {
    viewControl : new Subject(),
    viewControlF : {},
    util : {
        modalControl : {}
    },
    metadata : metadata,
    mouseEvent : new Subject()
}

// export const MODAL_CONTROL = window['nehubaUI']['util']['modalControl']

export const EVENTCENTER_CONST = {
    NEHUBAVIEWER : {
        TARGET : {
            LOAD_TEMPALTE : 'loadTemplate',
            NAVIGATE : 'navigation',
            MOUSE_ENTER_SEGMENT : 'mouseEnterSegment',
            MOUSE_LEAVE_SEGMENT : 'mouseLeaveSegment',
            SHOW_SEGMENT : 'showSegment',
            HIDE_SEGMENT : 'hideSegment',
            LOAD_LAYER : 'loadLayer'
        }
    },
    GLOBALLAYOUT : {
        TARGET : {
            THEME : 'theme'
        },
        BODY : {
            THEME : {
                LIGHT : 'light',
                DARK : 'dark'
            }
        }
    }
}

export const NEHUBAUI_CONSTANTS = {
    toolmode : {
        JuGeX : {
            "UIConfigURL":"http://172.104.156.15/json/colin",
            "plugins":[
                  {
                        "name":"JuGeX",
                        "type":"plugin",
                        "templateURL":"http://172.104.156.15/html/jugex.template",
                        "scriptURL":"http://172.104.156.15/js/jugex.script"
                  }
            ]
        }
    }
}

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