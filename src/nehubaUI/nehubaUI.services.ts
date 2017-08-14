
import { Injectable } from '@angular/core';
import { TemplateDescriptor,RegionDescriptor,ParcellationDescriptor,EventPacket } from './nehuba.model'
import { vec4,vec3 } from 'neuroglancer/util/geom'
import { Config as NehubaConfig } from 'nehuba/exports'
import { Subject } from 'rxjs/Rx'

// import { Viewer as NGViewer } from 'neuroglancer/viewer'

@Injectable()
export class NehubaFetchData {

    /* simiple fetch promise for json obj */
    /* nb: return header must contain Content-Type : application/json */
    /* or else an error will be thrown */

    fetchJson(url:string):Promise<any>{
        return fetch( url )
            .then( response =>{
                return response.json()
            })
            .then(json => {
                return json
            })
    }

    /* parse a json object to an object with nehubaconfig interface */
    parseNehubaConfig(json:any):Promise<NehubaConfig>{

        // const WHITE = vec4.fromValues(1.0, 1.0, 1.0, 1.0);
        // const BLACK = vec4.fromValues(0.0, 0.0, 0.0, 1.0);

        let convertValues = function(nehubaConfig:any):NehubaConfig{

            let returnObj : NehubaConfig = {}
            returnObj = nehubaConfig

            /* temporary measure, since nehubaconfig needs some value as vec4's */
            returnObj.dataset!.imageBackground = nehubaConfig.dataset.imageBackground ?  convertColor( nehubaConfig.dataset.imageBackground ) : vec4.fromValues(1.,1.,1.,1.)
            returnObj.layout!.planarSlicesBackground = nehubaConfig.layout.planarSlicesBackground ? convertColor( nehubaConfig.layout.planarSlicesBackground ) : undefined
            returnObj.layout!.useNehubaPerspective!.perspectiveSlicesBackground = nehubaConfig.layout.useNehubaPerspective.perspectiveSlicesBackground ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.perspectiveSlicesBackground ) : undefined
            returnObj.layout!.useNehubaPerspective!.removePerspectiveSlicesBackground!.color = nehubaConfig.layout.useNehubaPerspective.removePerspectiveSlicesBackground.color ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.removePerspectiveSlicesBackground!.color ) : undefined
            returnObj.layout!.useNehubaPerspective!.perspectiveBackground = nehubaConfig.layout.useNehubaPerspective.perspectiveBackground ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.perspectiveBackground ) : undefined
            returnObj.layout!.useNehubaPerspective!.mesh!.backFaceColor = nehubaConfig.layout.useNehubaPerspective.mesh.backFaceColor ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.mesh!.backFaceColor ) : undefined

            /* temporary measure, since some values needs to be vec4 */
            returnObj.layout!.useNehubaPerspective!.mesh!.removeOctant = nehubaConfig.layout.useNehubaPerspective.mesh.removeOctant ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.mesh!.removeOctant ) : undefined
            returnObj.layout!.useNehubaPerspective!.drawSubstrates!.color = nehubaConfig.layout.useNehubaPerspective.drawSubstrates.color ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.drawSubstrates!.color ) : undefined
            returnObj.layout!.useNehubaPerspective!.drawZoomLevels!.color = nehubaConfig.layout.useNehubaPerspective.drawZoomLevels.color ? convertColor( nehubaConfig.layout!.useNehubaPerspective!.drawZoomLevels!.color ) : undefined

            parseNgState(nehubaConfig.dataset).then(initState =>{
                returnObj.dataset!.initialNgState = initState
            })

            return returnObj
        }

        let convertColor = function(value:number[]):vec4{
            return vec4.fromValues(value[0],value[1],value[2],value[3])
        }

        let parseNgState = function(dataset:any):Promise<any>{
            return new Promise(resolve=>{
                if( dataset.initialNgState ){
                    resolve( dataset.initialNgState )
                } else if ( dataset.initialNgStateURL ){
                    fetch( dataset.initialNgStateURL )
                        .then( res =>{
                            return res.json()
                        })
                        .then( json =>{
                            resolve( json )
                        })
                }
            })
        }
        
        return new Promise((resolve)=>{

            if ( json.nehubaConfig ){
                resolve(convertValues( json.nehubaConfig ))
            } else if ( json.nehubaConfigURL ){
                
                fetch( json.nehubaConfigURL )
                    .then( res =>{
                        return res.json()
                    })
                    .then( json =>{
                        let returnObj = convertValues( json )
                        resolve( returnObj )
                    })
            } else {
                this.handleError('neither json.nehubaConfig nor nehubaConfigURL exist.')
                resolve({})
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
                        reject(e)
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
            let newTemplateDescriptor = new TemplateDescriptor( json.name )
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
    
    /* legacy codes below. no longer necessary */

    // /* this should become obsolete soon */
    // fetchTemplateData():Promise<FetchedTemplates>{
    //     return fetch( FETCH_DATA_URL )
    //         .then( response => {
    //             return response.json()
    //         } )
    //         .then( json => {
    //             //this is where fetched data (in json format) is fitted into templates. 
    //             //in the future, should real api becomes available, these codes will need to change reflecting the real api's
    //             let returnTemplates = new FetchedTemplates();
    //             for (let idx in json.data){
    //                 if( /Colin/.test(json.data[idx].name) ){
    //                     returnTemplates.templates.push( this.processColinTemplate(json.data[idx]) )
    //                 }else if(/Waxholm/.test( json.data[idx].name )){
    //                     returnTemplates.templates.push( this.processWaxholmTemplate(json.data[idx]) )
    //                 }else{
    //                     returnTemplates.templates.push( this.processMockTemplate(json.data[idx]) )
    //                 }
    //             }
    //             return Promise.resolve( returnTemplates );
    //         })
    //         .catch( error => this.handleError(error));
    // }


    // //we might need one of these for every data source
    // //to do: should these methods be returning a promise or templatedescriptor object?
    // //ie if we expect any of these to be async?
    // private processMockTemplate(rawTemplate:any):TemplateDescriptor{

    //     //instantiate a new instance of template descriptor, to be returned by the promise
    //     let returnTemplateDescriptor = new TemplateDescriptor(rawTemplate.name)
        
    //     //populate the parcellation descriptor array according to the returned json obj
    //     for(let idxP in rawTemplate.parcellations){
    //         returnTemplateDescriptor.parcellations.push(new ParcellationDescriptor(rawTemplate.parcellations[idxP]))
    //     }

    //     //populate the region descriptor array according to the return json obj
    //     for(let idxR in rawTemplate.regions){
    //         // returnTemplateDescriptor.regions.push(new RegionDescriptor(rawTemplate.regions[idxR]))
    //     }

    //     return returnTemplateDescriptor
    // }

    // /* this is to demonstrate that we can implement custom parser for datasets with non-standard metadata */
    // private processColinTemplate(rawTemplate:any):TemplateDescriptor{
    //     let returnTemplateDescriptor = new TemplateDescriptor(rawTemplate.name)
        
    //     for(let idxP in rawTemplate.parcellations){
    //         returnTemplateDescriptor.parcellations.push(new ParcellationDescriptor(rawTemplate.parcellations[idxP]))
    //     }

    //     // returnTemplateDescriptor.regions = this.parseSpaceConjugatedHierarchical(rawTemplate.regions)

    //     return returnTemplateDescriptor
    // }

    // private processWaxholmTemplate(template:any):TemplateDescriptor{
    //     let returnTemplateDescriptor = new TemplateDescriptor(template.name)
    //     for(let idxP in template.parcellations){
    //         returnTemplateDescriptor.parcellations.push(new ParcellationDescriptor(template.parcellations[idxP]))
    //     }
    //     // returnTemplateDescriptor.regions = this.parseHierarchical( template.regions,0 )
    //     return returnTemplateDescriptor
    // }

    // private parseHierarchical(data:any[],hierarchy:number):RegionDescriptor[]{
    //     let returnRegionDescriptors = []
    //     for( let idx in data ){
    //         let newRegionDescriptor = new RegionDescriptor( data[idx].name )
    //         if( data[idx].children && data[idx].children.length > 0){
    //             newRegionDescriptor.children = this.parseHierarchical( data[idx].children,hierarchy+1 )
    //         }
    //         if( data[idx].properties ){
    //             newRegionDescriptor.properties = data[idx].properties
    //         }
    //         newRegionDescriptor.hierarchy = hierarchy
    //         returnRegionDescriptors.push( newRegionDescriptor )
    //     }
    //     return returnRegionDescriptors
    // }

    // private parseSpaceConjugatedHierarchical(data:string):RegionDescriptor[]{
    //     let returnRegionDescriptors : RegionDescriptor[] = []
    //     let space : number = 0
    //     data.split('\n').forEach(( value )=>{
    //         let [ returnedSpace , regionName ] = this.spaceConjugationLineParser( value )
    //         if( returnedSpace == 0 ){
    //             let newRegionDescriptor = new RegionDescriptor( regionName )
    //             newRegionDescriptor.hierarchy = returnedSpace
    //             returnRegionDescriptors.push(newRegionDescriptor)
    //         }else{

    //             let newregion = new RegionDescriptor( regionName )
    //             newregion.hierarchy = returnedSpace

    //             let tempMulti : RegionDescriptor[] = returnRegionDescriptors
    //             while(returnedSpace > 0){
    //                 tempMulti = tempMulti[ tempMulti.length - 1 ].children
    //                 returnedSpace --
    //             }

    //             if( !tempMulti ){
    //                 tempMulti = []
    //             }
    //             tempMulti.push( newregion )
    //         }
    //     })
    //     return returnRegionDescriptors
    // }

    // private spaceConjugationLineParser(line:string):[number,string]{
    //     let counter :number = 0
    //     while( line.substring(0,1) === ' ' ){
    //         counter ++
    //         line = line.substring(1)
    //     }

    //     return [counter,line]
    // }
}

export class Navigation{
    position:vec3
    rotation:[number,vec3]
    zoom:number
    rotationAxisAngle:vec3

    constructor(){
        this.position = vec3.fromValues(0,0,0)
        // this.position = vec3.fromValues(-741.0856323242188,1876.8900146484375,481.2494201660156)
        this.rotation = [0,vec3.fromValues(1.,0.,0.)]
        this.rotationAxisAngle = vec3.create()
        this.zoom = 500000
    }

    public setRotation(deg:number,axis:vec3):void{
        this.rotation[0] = deg
        this.rotation[1] = axis
    }

    public getRotation(): [number,vec3]{
        return this.rotation
    }

    public setPosition(pos:vec3):void{
        this.position = pos
    }

    public getPosition():vec3{
        return this.position
    }

    public resetNavigation():void{
        this.position = vec3.fromValues(0,0,0)
        // this.position = vec3.fromValues(-741.0856323242188,1876.8900146484375,481.2494201660156)
        this.rotation = [0,vec3.fromValues(1.,0,0)]
        this.zoom = 500000
    }
}

export class EventCenter{
    floatingWidgetRelay : Subject<EventPacket>
    constructor(){
        this.floatingWidgetRelay = new Subject()

        this.floatingWidgetRelay.subscribe({
            next : (v) => console.log(v)
        })
    }

    // createNewRelay():Subject<EventPacket>{


    // }
}
// export class NehubaNavigator{

//     public navigation : Navigation
//     public navigationControl : NGViewer
    
//     constructor(){
//         this.navigation = new Navigation()
//         this.navigationRotQuaternionDiff = quat.create()
//         this.invertedQuat = quat.create()
//         this.normalizedVec3 = vec3.create()

//         this.navigationRotRad = 0
//         this.navigationRotAxis = vec3.create()

//         this.navigationAnimationRotRad = 0
//         this.navigationAnimationRotAxis = vec3.create()

//         this.navigationStartrot = quat.create()
//         this.navigationEndrot = quat.create()

//         this.resetView()
//     }

//     public registerViewer(viewer:NGViewer){
//         this.navigationControl = viewer
//     }

//     //listening to the NG navigationState change dispatch nullary signal
//     public navigationStateChangeListener(doneCallback: () => void){

//         /* if navigationstate.position is resetted, I wonder if toJSON will return undefined? */
        
//         /* .toJSON() can return undefined */
//         /* need to catch */

//         /* waiting on nehuba viewer navigation implementation */
        
//         this.navigation.setPosition(vec3.fromValues(
//             this.navigationControl.navigationState.position.toJSON().voxelCoordinates[0],
//             this.navigationControl.navigationState.position.toJSON().voxelCoordinates[1],
//             this.navigationControl.navigationState.position.toJSON().voxelCoordinates[2]))
        

//         /* viewer.navigationState.pose.orientation.toJSON() may return undefined if reset pose is called */
//         /* I wonder if viewer.navigationState.pose.orientation.orientation can ever be undefined */
//         /* somehow viewer.navigationState.pose.orientation.orientation can return [NaN, NaN, NaN, NaN] */

//         /* waiting on nehuba viewer navigation implemnetation */
        
//         if( isNaN(this.navigationControl.navigationState.pose.orientation.orientation[0]) ){
//             this.navigationControl.navigationState.pose.orientation.reset()
//         }else{
//             this.navigationRotRad = quat.getAxisAngle( this.navigationRotAxis,this.navigationControl.navigationState.pose.orientation.orientation)
//             this.navigation.setRotation( this.navigationRotRad, this.navigationRotAxis )
//         }
        
//         doneCallback()
//     }

//     //listening to the NG mousemove change dispatch signal
//     public mouseMoveChangeListener(doneCallback: () =>void){
//         /* update mouse position model here */
//         doneCallback()
//     }

//     public resetView():void{
//         this.navigation.resetNavigation()
//         this.navigateView()
//     }

//     public navigateView():void{
        
//         /* I wonder if viewer.navigationState.pose.orientation.orientation can ever be undefined */
//         //waiting on nehuba viewer implementations
        
//         this.navigationRotRad = quat.getAxisAngle( this.navigationRotAxis,this.navigationControl.navigationState.pose.orientation.orientation)
        
//         /* toJSON() can return undefined */
//         /* need to catch */

//         //waiting on nehuba viewer implementaiton
        
//         this.gotoVoxelAnimation(500,
//             vec3.fromValues(
//                 this.navigationControl.navigationState.position.toJSON().voxelCoordinates[0],
//                 this.navigationControl.navigationState.position.toJSON().voxelCoordinates[1],
//                 this.navigationControl.navigationState.position.toJSON().voxelCoordinates[2]),
//             this.navigation.getPosition(),
//             [ this.navigationRotRad , this.navigationRotAxis ],
//             this.navigation.getRotation())
        
//     }

//     //debug only
    
//     testbutton():void{
//         /*
//         console.log(viewer)
//         viewer.navigationState.pose.orientation.reset()
//         */
//     }

//     //navigation animation related variables.
//     navigationDuration : number = 0
//     navigationAnCountDown : number = 0
//     navigationAnTimeKeeper : number = 0
//     navigationReqAnFrame : any

//     navigationReqAnFrameTracker : any

//     navigationStartpos : vec3
//     navigationEndpos : vec3

//     navigationStartrot : quat
//     navigationEndrot : quat

//     navigationRotQuaternionDiff : quat
//     navigationRotRad : number
//     navigationRotAxis : vec3

//     navigationAnimationRotRad : number
//     navigationAnimationRotAxis : vec3

//     /* dummy variables */
//     invertedQuat : quat
//     normalizedVec3 : vec3

//     //animation move to the desired voxel
//     //needs: starting voxel position, end voxel position, duration
//     public gotoVoxelAnimation(duration:number,startpos:vec3,endpos:vec3,startrot:[number,vec3],endrot:[number,vec3]):void{

//         /* in case a new request for navigation animation fires before the previous one finishes */
//         if( this.navigationReqAnFrameTracker ){
//             cancelAnimationFrame( this.navigationReqAnFrameTracker )
//         }

//         this.navigationAnCountDown = duration
//         this.navigationDuration = duration
//         this.navigationAnTimeKeeper = Date.now()

//         this.navigationStartpos = startpos
//         this.navigationEndpos = endpos

//         this.navigationStartrot = quat.setAxisAngle( this.navigationStartrot , startrot[1] , startrot[0] )
//         this.navigationEndrot = quat.setAxisAngle( this.navigationEndrot , endrot[1] , endrot[0] )
        
//         /* find the difference between two quarernions */
//         this.navigationRotQuaternionDiff = quat.mul(
//             this.navigationRotQuaternionDiff,
//             quat.invert( this.invertedQuat, this.navigationStartrot ),
//             this.navigationEndrot )

//         if( this.navigationDuration > 0 ){
//             this.navigationAnimationRotRad = quat.getAxisAngle( this.navigationAnimationRotAxis , this.navigationRotQuaternionDiff ) / this.navigationDuration
//         }else{
//             this.navigationAnimationRotRad = quat.getAxisAngle( this.navigationAnimationRotAxis , this.navigationRotQuaternionDiff )
//         }

//         this.navigationReqAnFrameTracker = requestAnimationFrame(this.gotoVoxelAnimationLinear.bind(this))
//     }

//     private gotoVoxelAnimationLinear():void{

//         if( this.navigationAnCountDown <= 0 ){
//             this.gotoVoxel(this.navigationEndpos)
//             this.rotate( this.navigationAnimationRotAxis , this.navigationAnimationRotRad )
//             this.navigationReqAnFrameTracker = null
//         }else{
//             this.navigationAnCountDown -= Date.now() - this.navigationAnTimeKeeper
            
//             /* do rotation here */
//             this.rotate( this.navigationAnimationRotAxis , this.navigationAnimationRotRad * ( Date.now() - this.navigationAnTimeKeeper ) )

//             this.navigationAnTimeKeeper = Date.now()

//             /* do movement here */
//             this.gotoVoxel(vec3.fromValues(
//                     this.navigationStartpos[0] * this.navigationAnCountDown / this.navigationDuration + this.navigationEndpos[0] * ( 1 - this.navigationAnCountDown / this.navigationDuration),
//                     this.navigationStartpos[1] * this.navigationAnCountDown / this.navigationDuration + this.navigationEndpos[1] * ( 1 - this.navigationAnCountDown / this.navigationDuration),
//                     this.navigationStartpos[2] * this.navigationAnCountDown / this.navigationDuration + this.navigationEndpos[2] * ( 1 - this.navigationAnCountDown / this.navigationDuration)
//                 )
//             )
//             this.navigationReqAnFrameTracker = requestAnimationFrame(this.gotoVoxelAnimationLinear.bind(this))
//         }
//     }

//     //teleports to the described location
//     private gotoVoxel(pos:vec3):void{
//         pos
//         //waiting on nehuba viewer implementation
//         this.navigationControl.navigationState.pose.position.setVoxelCoordinates(pos)
//     }

//     //rotate relative to the current rotation configuration
//     private rotate(axis:vec3,rad:number){
//         axis
//         rad
//         //waiting on nehuba viwer implementation
//         this.navigationControl.navigationState.pose.rotateRelative(axis,rad)
//     }
// }