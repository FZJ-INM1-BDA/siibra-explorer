import { DecimalPipe } from '@angular/common'
import { Injectable } from '@angular/core';
import { vec4 } from 'neuroglancer/util/geom'
import { Config as NehubaConfig } from 'nehuba/exports'
import { Subject } from 'rxjs/Rx'

import { TemplateDescriptor,RegionDescriptor,ParcellationDescriptor,EventPacket } from './nehuba.model'
import { TIMEOUT } from './nehuba.config'
// import { Viewer as NGViewer } from 'neuroglancer/viewer'

@Injectable()
export class NehubaFetchData {

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

    /* parse a json object to an object with nehubaconfig interface */
    parseNehubaConfig(json:any):Promise<NehubaConfig>{

        const convertValues = function(nehubaConfig:any):NehubaConfig{

            if ( nehubaConfig.dataset ){
                if( nehubaConfig.dataset.imageBackground ){
                    nehubaConfig.dataset.imageBackground = convertColor(nehubaConfig.dataset.imageBackground)
                }else{
                    nehubaConfig.dataset.imageBackground = vec4.fromValues(1.,1.,1.,1.)
                }
            } 

            if (nehubaConfig.layout){

                /* TODO: fix this, either check values exist first, or when number[] is implemented */
                /* temporary measure, since nehubaconfig needs some value as vec4's */
                // returnObj.dataset!.imageBackground = nehubaConfig.dataset.imageBackground ?  convertColor( nehubaConfig.dataset.imageBackground ) : vec4.fromValues(1.,1.,1.,1.)
                
                nehubaConfig.layout.planarSlicesBackground = nehubaConfig.layout.planarSlicesBackground ? convertColor( nehubaConfig.layout.planarSlicesBackground ) : undefined

                if( nehubaConfig.layout.useNehubaPerspective ){
                    nehubaConfig.layout.useNehubaPerspective.perspectiveSlicesBackground = nehubaConfig.layout.useNehubaPerspective.perspectiveSlicesBackground ? convertColor( nehubaConfig.layout.useNehubaPerspective.perspectiveSlicesBackground ) : undefined
                    nehubaConfig.layout.useNehubaPerspective.removePerspectiveSlicesBackground.color = nehubaConfig.layout.useNehubaPerspective.removePerspectiveSlicesBackground.color ? convertColor( nehubaConfig.layout.useNehubaPerspective.removePerspectiveSlicesBackground.color ) : undefined
                    nehubaConfig.layout.useNehubaPerspective.perspectiveBackground = nehubaConfig.layout.useNehubaPerspective.perspectiveBackground ? convertColor( nehubaConfig.layout.useNehubaPerspective.perspectiveBackground ) : undefined
                    
                    if( nehubaConfig.layout.useNehubaPerspective.mesh ){
                        nehubaConfig.layout.useNehubaPerspective.mesh.backFaceColor = nehubaConfig.layout.useNehubaPerspective.mesh.backFaceColor ? convertColor( nehubaConfig.layout.useNehubaPerspective.mesh.backFaceColor ) : undefined
                        nehubaConfig.layout.useNehubaPerspective.mesh.removeOctant = nehubaConfig.layout.useNehubaPerspective.mesh.removeOctant ? convertColor( nehubaConfig.layout.useNehubaPerspective.mesh.removeOctant ) : undefined
                    }

                    if ( nehubaConfig.layout.useNehubaPerspective.drawSubstrates ){
                        nehubaConfig.layout.useNehubaPerspective.drawSubstrates.color = nehubaConfig.layout.useNehubaPerspective.drawSubstrates.color ? convertColor( nehubaConfig.layout.useNehubaPerspective.drawSubstrates.color ) : undefined
                    }
                
                    if ( nehubaConfig.layout.useNehubaPerspective.drawZoomLevels ){
                        nehubaConfig.layout.useNehubaPerspective.drawZoomLevels.color = nehubaConfig.layout.useNehubaPerspective.drawZoomLevels.color ? convertColor( nehubaConfig.layout.useNehubaPerspective.drawZoomLevels.color ) : undefined
                    }
                }
                /* temporary measure, since some values needs to be vec4 */

            }
            const returnObj : NehubaConfig = nehubaConfig
            return returnObj
        }

        const convertColor = function(value:number[]):vec4{
            return vec4.fromValues(value[0],value[1],value[2],value[3])
        }

        const parseOrFetchInitialNgState = function(dataset:any):Promise<any>{
            return new Promise((resolve,reject)=>{
                if( dataset.initialNgState ){
                    resolve( dataset.initialNgState )
                } else if ( dataset.initialNgStateURL ){
                    fetch( dataset.initialNgStateURL )
                        .then( res => res.json())
                        .then( json =>{
                            resolve( json )
                        })
                } else {
                    reject( 'parseOrFetchInitialNgState error. neither initialNgState Nor initialNgStateURL are present' )
                }
            })
        }
        
        return new Promise((resolve,reject)=>{

            if ( json.nehubaConfig ){
                const nehubaConfig = convertValues( json.nehubaConfig )
                parseOrFetchInitialNgState( nehubaConfig.dataset )
                    .then(initState =>{
                        nehubaConfig.dataset!.initialNgState = initState
                        resolve( nehubaConfig )
                    })
            } else if ( json.nehubaConfigURL ){
                
                this.fetchJson( json.nehubaConfigURL )
                    .then( nehubaConfigJson =>{
                        const nehubaConfig = convertValues( nehubaConfigJson )
                        parseOrFetchInitialNgState( nehubaConfigJson.dataset )
                            .then(initState =>{
                                nehubaConfig.dataset!.initialNgState = initState
                                resolve( nehubaConfig )
                            })
                    })
            } else {
                this.handleError('neither json.nehubaConfig nor nehubaConfigURL exist.')
                reject('neither json.nehubaConfig nor nehubaConfigURL exist.')
            }
        })
    }

    parseTemplateData(json:any):Promise<TemplateDescriptor>{

        let promiseArray : Promise<any>[] = []

        /* nehubaviewer config */
        promiseArray.push( 
            new Promise((resolve,reject)=>{
                this.parseNehubaConfig( json )
                    .then(config=>{
                        resolve(config)
                    }) 
                    .catch( e =>{
                        this.handleError(e)
                        reject( e )
                    })
                })
            )

        /* properties will define what gets displayed in the modal window */
        /* goinng to be strict on what gets displayed and what does not */
        promiseArray.push(
            new Promise((resolve)=>{
                if (json.properties){
                    resolve(json.properties)
                }else if(json.getPropertiesUrl){
                    this.fetchJson( json.getPropertiesUrl )
                        .then(obj=>{
                            resolve(obj)
                        })
                        .catch(e=>{
                            this.handleError('fetching template properties error')
                            this.handleError(e)
                            resolve({})
                        })
                }else{
                    /* if there is no properties field */
                    /* nor is there a getPropertiesUrl field */
                    /* then return an empty object */
                    resolve({})
                }
                }))

        /* parse the parcellation described by the template */
        promiseArray.push(
            new Promise(resolve=>{
                if ( json.parcellations ){
                    /* if the parcellations already exist */
                    resolve(json.parcellations)
                    // json.parcellations.forEach( (parcellation:any) => newTemplateDescriptor.parcellations.push( this.parseParcellationData( parcellation ) ) )
                } else if ( json.parcellationsURL ) {
                    /* if parcellations were not defined, but the method of fetching a list of parcellations exist */
                    this.fetchJson( json.parcellationsURL ).then( (obj:any)=>{
                        resolve(obj)
                        // newTemplateDescriptor.parcellations.push(this.parseParcellationData(obj))
                    })
                } else {
                    this.handleError('parse tempaltedata error. Neither json.parcellations nor json.parcellationsURL exist ')
                    resolve([])
                }
            })
        )

        
        return new Promise((resolve) =>{
            let newTemplateDescriptor = new TemplateDescriptor( json )
            Promise.all( promiseArray ).then( (values) =>{
                    newTemplateDescriptor.nehubaConfig = values[0]
                    newTemplateDescriptor.properties = values[1]
                    if(values[2].constructor === Array || values[2].constructor === Object){
                        for(let key in values[2]){
                            this.parseParcellationData((<any>values[2])[key])
                                .then(parcellation=>{
                                    newTemplateDescriptor.parcellations.push( parcellation )
                                })
                        }
                    }else{
                        this.handleError('resolved promise from parcellation is not of array or object type')
                    }
                    resolve( newTemplateDescriptor )
                })
        })
    }

    parseParcellationData(json:any):Promise<ParcellationDescriptor>{

        let promiseArray : Promise<any>[] = []

        /* properties will define what gets displayed in the modal window */
        /* goinng to be strict on what gets displayed and what does not */
        promiseArray.push(
            new Promise((resolve)=>{
                if (json.properties){
                    resolve(json.properties)
                }else if(json.getPropertiesUrl){
                    this.fetchJson( json.getPropertiesUrl )
                        .then(obj=>{
                            resolve(obj)
                        })
                        .catch(e=>{
                            this.handleError('fetching parcellation properties error')
                            this.handleError(e)
                            resolve({})
                        })
                }else{
                    /* if there is no properties field */
                    /* nor is there a getPropertiesUrl field */
                    /* then return an empty object */
                    resolve({})
                }
                }))
        
        promiseArray.push(new Promise(resolve=>{
            if( json.regions ){
                let regionsArray:Promise<RegionDescriptor>[] = []
                json.regions.forEach((region:any) =>{
                    regionsArray.push(this.validateRegionData(region,0))
                })
                Promise.all(regionsArray).then(values=>{
                    let r:RegionDescriptor[] = []
                    values.forEach(value=>{
                        r.push(value)
                    })
                    resolve(r)
                })
            }else if( json.regionsURL ){
                this.fetchJson( json.regionsURL )
                    .then( obj =>{
                        let regionsArray:Promise<RegionDescriptor>[] = []
                        obj.forEach((region:any) =>{
                            regionsArray.push(this.validateRegionData(region,0))
                        })
                        Promise.all(regionsArray).then(values=>{
                            let r:RegionDescriptor[] = []
                            values.forEach(value=>{
                                r.push(value)
                            })
                            resolve(r)
                        })
                    })
            }else if ( json.getUrl ){
                this.fetchJson( json.getUrl )
                    .then(obj=>{
                        this.parseParcellationData(obj)
                            .then(parcellation=>{
                                resolve(parcellation.regions)
                            })
                            .catch(e=>{
                                this.handleError('json.geturl, then parse parcellation data failed')
                                this.handleError(e)
                                resolve([])
                            })
                    })
                    .catch(e=>{
                        this.handleError('fetchjson json.geturl failed')
                        this.handleError(e)
                        resolve([])
                    })
            }else{
                /* resolves with an empty array */
                resolve([])
            }
        }))

        return new Promise(resolve=>{
            Promise.all(promiseArray)
                .then(values=>{
                    let returnParcellation = new ParcellationDescriptor(json.name)
                    returnParcellation.properties = values[0]
                    returnParcellation.regions = values[1]
                    resolve(returnParcellation)
                })
        })
    }

    validateRegionData(json:any,hierarchy:number):Promise<RegionDescriptor>{
        let promiseArray : Promise<any>[] = []

        /* properties will define what gets displayed in the modal window */
        promiseArray.push(
            new Promise((resolve)=>{
                if (json.properties){
                    resolve(json.properties)
                }else if(json.getPropertiesUrl){
                    this.fetchJson( json.getPropertiesUrl )
                        .then(obj=>{
                            resolve(obj)
                        })
                        .catch(e=>{
                            this.handleError('fetching template properties error')
                            this.handleError(e)
                            resolve({})
                        })
                }else{
                    /* if there is no properties field */
                    /* nor is there a getPropertiesUrl field */
                    /* then return an empty object */
                    resolve({})
                }
                }))
        
        /* fetches all of its children */
        promiseArray.push(new Promise(resolve=>{
            if (json.children && json.children.constructor === Array){
                let regionsArray:Promise<RegionDescriptor>[] = []
                json.children.forEach((child:any) =>{
                    regionsArray.push(this.validateRegionData(child,hierarchy+1))
                })
                Promise.all(regionsArray).then(values=>{
                    let r:RegionDescriptor[] = []
                    values.forEach(value=>{
                        r.push(value)
                    })
                    resolve(r)
                })
            } else {
                resolve([])
            }
        }))

        return new Promise((resolve,reject)=>{
            Promise
                .all(promiseArray)
                .then(values=>{
                    let newRegionDescriptor = new RegionDescriptor( json.name )
                    if (json.label_index){
                        newRegionDescriptor.label_index = json.label_index
                    }
                    if (json.default_loc){
                        newRegionDescriptor.default_loc = json.default_loc
                    }
                    if(json.PMapUrl){
                        newRegionDescriptor.PMapUrl = json.PMapUrl
                    }
                    newRegionDescriptor.hierarchy = hierarchy
                    newRegionDescriptor.properties = values[0]
                    newRegionDescriptor.children = values[1]
                    resolve(newRegionDescriptor)
                })
                .catch(e=>{
                    this.handleError('resolving all promises in validating regional data failed')
                    this.handleError(e)
                    reject(e)
                })
        })
    }

    private handleError(error:any):Promise<any>{
        console.log('An error had occured',error);
        return Promise.reject(error.message||error);
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

    modalEventRelay : Subject<EventPacket> = new Subject()
    nehubaViewerRelay : Subject<EventPacket> = new Subject()
    globalLayoutRelay : Subject<EventPacket> = new Subject()

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
