import { Config as Nehubaconfig } from 'nehuba/exports'
import { VIEWER_CONTROL,CM_MATLAB_HOT,CM_THRESHOLD } from './nehubaUI.services'
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';

export class LayerProperties{
  constructor(json:any){
    for(let key in this){
      if(json[key]){
        this[key] = json[key]
      }
    }
  }
  type:string = '';
  source:string = '';
  transform:number[][] = [
    [1,0,0,0],
    [0,1,0,0],
    [0,0,1,0],
    [0,0,0,1]
  ]
  shader:string = ''
}

export class LayerDescriptor {
  constructor(name:string,json:any){
    this.name = name
    this.properties = new LayerProperties(json)
  }
  properties : LayerProperties;
  name : string;
  masterOpacity : number = 1.0;

  isShown : boolean = true;
  subPanelShown : boolean = false;
}

export class Property{
  constructor(obj:any){
    try{
      this.name = obj.name
      if( obj.fields ){
        this.fields = obj.fields
      }else if ( obj.getUrl ){
        let self = this
        fetch(obj.getUrl)
          .then(resp=> {
            return resp.json()
          })
          .then(json=>{
            self.fields = json
          })
          .catch(err=>{
            throw new Error(err)
          })
      }else {
        this.fields = {}
      }
    }catch (e) {
      console.log('Error parsing property object',e)
      console.log('Dumping text instead ...')
      this.name = "Text Info"
      this.fields = {
        "raw":JSON.stringify(obj)
      }
    }
  }

  name:string   /* will be displayed as title */
  fields:any    /* will be displayed as key JSON.stringify(value) pair */
          /* set as an empty set if no values are to be displayed */
  getUrl:string   /* will be called if fields do not exist */

  /* fallback: fields are populated with length zero array */
  /* sample objs to be passed to Property constructor:

  {
    "name"    : "Academic Information",
    "fields"  : {
      "authors"     : "K.A. Person, B.A. Mass",
      "affiliation"   : "FZ Juelich"
    },
    "getUrl"  : "http://www.examples.org/sample/academic"  //will be ignored
  }

  {
    "name"    : "Histological Information",
    "getUrl"  : "http://www.examples.org/sample/histological"
  }
  
  {
    "name"    : "NB: This information is licensed under MIT license."
    "fields"  : []
  }

  */
}

export class TemplateDescriptor {
  constructor(json:any){

    this.name = json.name ? json.name : 'Untitled Template'
    this.useTheme = json.useTheme ? json.useTheme : 'light'
    this.properties = json.properties ? json.properties : []
    this.nehubaId = json.nehubaId ? json.nehubaId : ''

    this.parcellations = json.parcellations && json.parcellations.constructor.name == 'Array' ? json.parcellations.map((json:any)=>new ParcellationDescriptor(json)) : [];
    
    (new Promise((resolve,reject)=>{
      json.nehubaConfig ? 
        resolve(json.nehubaConfig) : 
        json.nehubaConfigURL ? 
          fetch(json.nehubaConfigURL)
            .then(res=>res.json())
            .then(json=>resolve(json))
            .catch(e=>reject(e)) :
        reject('no nehuba config URL')
    }))
      .then(nehubaConfig=>{
        this.nehubaConfig = nehubaConfig
      })
      .catch(e=>{
        console.log('constructing template error',e)
      })
  }
  name : string;
  useTheme : string;
  parcellations : ParcellationDescriptor[];
  properties : any;
  nehubaId : string;
  
  nehubaConfig : Nehubaconfig;
}

export class ParcellationDescriptor {
  constructor(json:any){
    this.name = json.name
    this.ngId = json.ngId 
    this.regions = json.regions ? json.regions.map((region:any)=>new RegionDescriptor(region,0)) : []
    this.properties = json.properties ? json.properties : []

    this.regions.forEach(region=>this.iterateColorMap(region))
    this.surfaceParcellation = json.surfaceParcellation
    if( this.surfaceParcellation ) this.colorMap.set(65535,{red:255,green:255,blue:255})
  }
  regions : RegionDescriptor[];
  name : string;
  getUrl : string;
  properties : any;
  ngId : string;
  surfaceParcellation : boolean = false;

  isShown : boolean = true;
  masterOpacity : number = 1.00;

  colorMap : Map<number,{red:number,green:number,blue:number}> = new Map()
  iterateColorMap = (region:RegionDescriptor)=>{
    if( region.labelIndex ){
      this.parseColor(region)
    }
    region.children.forEach(region=>this.iterateColorMap(region))
  }
  parseColor = (region:RegionDescriptor) => {
    const rgb = (rgb:number[])=> ({red:rgb[0],green:rgb[1],blue:rgb[2]})
    try{
      this.colorMap.set(region.labelIndex,rgb(region.rgb))
    }catch(e){
      this.colorMap.set(region.labelIndex,rgb([0,0,0]))
    }
  }
}

export class PluginDescriptor{
  constructor(param:any){
    this.name = param.name
    this.templateURL = param.templateURL
    this.scriptURL = param.scriptURL
  }
  templateURL : string
  scriptURL : string
  name : string
}

export class Multilevel{

  name : string; /* should be overwritten by subclasses */

  enabled : boolean = false;

  hierarchy : number;
  parent : Multilevel | undefined;
  children : Multilevel[];
  isExpanded : boolean = true;
  isExpandedString : 'expanded' | 'collapsed' = 'collapsed'
  isVisible : boolean = true

  constructor(){
    this.enabled = false
    this.children = []
  }

  public disableSelfAndAllChildren = ():void => {
    this.enabled = false
    this.children.forEach( child => child.disableSelfAndAllChildren())
  }

  public enableSelfAndAllChildren = ():void => {
    this.enabled = true
    this.children.forEach( child => child.enableSelfAndAllChildren())
  }

  /* used to determine the tick status (selected, unselected, partially selected) */
  public hasDisabledChildren = ():boolean =>
    this.children.length > 0 ?
      this.children.some( child => child.hasDisabledChildren() ) :
      !this.enabled

  public hasEnabledChildren = ():boolean =>
    this.children.length > 0 ?
      this.children.some( child => child.hasEnabledChildren() ) :
      this.enabled

  /* used for searching and filtering tree */
  public hasVisibleChildren = ():boolean => 
    this.children.length > 0 ? 
      this.children.some( child=> this.isVisible || child.hasVisibleChildren()) :
      this.isVisible     
}

export class RegionDescriptor extends Multilevel implements DescriptorMoreInfo{

  constructor(json:any,hierachy:number){
    super()
    this.name = json.name
    this.properties = json.properties ? json.properties : []
    this.labelIndex = json.labelIndex ? json.labelIndex : null
    this.hierarchy = hierachy
    this.PMapURL = json.PMapURL ? json.PMapURL : null
    this.position = json.position ? json.position : null
    this.children = json.children && json.children.constructor == Array ? json.children.map((region:any)=>new RegionDescriptor(region,hierachy+1)) : []
    this.rgb = json.rgb ? json.rgb : null

    /* populate moreInfo array */
    if(this.position){
      const goToPosition = new DescriptorMoreInfoItem('Go To There','map-marker')
      goToPosition.action = ()=>{
        VIEWER_CONTROL.moveToNavigationLoc(this.position,true)
      }
      this.moreInfo.push(goToPosition)
    }
    if(this.PMapURL){
      const pmap = new DescriptorMoreInfoItem('Probability Map','picture')
      pmap.action = () => {

        /* move viewer to the relevant location */
        if(this.position)VIEWER_CONTROL.moveToNavigationLoc(this.position,true)

        const pMapObj = {
          PMap : {
            type : 'image',
            source : 'nifti://'+this.PMapURL,
            shader : `void main(){float x=toNormalized(getDataValue());${CM_MATLAB_HOT}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`
          }
        }

        /* setting timeout is required... or else the pMap, or parcellation looks wonky */
        setTimeout(()=>{
          VIEWER_CONTROL.loadLayer(pMapObj)
          VIEWER_CONTROL.hideAllSegments()
          VIEWER_CONTROL.reapplyNehubaMeshFix()
        })

        // if(gPluginControl['PMap']){
        //   gPluginControl['PMap'].blink(10)
        // }else{
        //   const newWidget = new LabComponent(PMAP_WIDGET)
        //   HelperFunctions.sLoadPlugin(newWidget)
        // }
      }
      pmap.source = 'nifti://'+this.PMapURL
      this.moreInfo.push(pmap)
    }

    if(json.receptorData){
      const receptorData = new DescriptorMoreInfoItem('Receptor Data','tag')
      receptorData.action = ()=>{
        if(this.position)VIEWER_CONTROL.moveToNavigationLoc(this.position,true)
        VIEWER_CONTROL.hideAllSegments()
        VIEWER_CONTROL.showSegment(this.labelIndex)
        /* TODO find a more permanent way to pass the selected rectpro data to mainController */
      }
      receptorData.source = json.receptorData
      this.moreInfo.push(receptorData)
    }
  }

  children : RegionDescriptor[] = []
  name : string
  properties : any
  getUrl: string
  labelIndex : number
  position : number[]
  PMapURL : string
  rgb : number[]

  moreInfo : DescriptorMoreInfoItem[] = []
}

export interface DescriptorMoreInfo{
  moreInfo : any[]
}

export class DescriptorMoreInfoItem{
  name : string
  desc : string
  icon : string
  source : string
  action : ()=>void = ()=>{}
  constructor(name:string,icon:string){
    this.name = name
    this.icon = icon
  }
}

export class LabComponent implements OnDestroy{
  script : HTMLElement
  template : HTMLElement
  name : string

  author : string
  desc : string

  constructor(json:any){
    this.name = json.name ? json.name : 'Untitled';
    this.author = json.author ? json.author : 'No author provided.';
    this.desc = json.desc ? json.desc : 'No description provided.';

    this.script = document.createElement('script')
    if( json.script ){
      this.script.innerHTML = json.script
    }else if(json.scriptURL){
      this.script.setAttribute('src',json.scriptURL)
    }

    this.template = document.createElement('div')
    if( json.template ){
      this.template.innerHTML = json.template
    }else if( json.templateURL ){

      /* unless we want to introduce timeout mechanism, no need for Promise.race */
      // Promise.race([
      // ])
      
      fetch(json.templateURL)
        .then(resp=>resp.text())
        .then(template=>{
          this.template.innerHTML = template
        })
        .catch(e=>{
          console.log('error fetching plugin template',e)
        })
    }
  }

  ngOnDestroy = ()=>{
    console.log('destorying labcomponent')
  }
}

export class LabComponentHandler{
  public blink : (sec?:number)=>void
  public pushMessage : (string:string)=>void
  public shutdown : ()=>void
  public onShutdown : (cb:()=>void)=>void
}

export class Landmark{
  pos : [number,number,number]
  id : string
  properties : any
  hover : boolean 
}

export interface widgitiseTempRefMetaData{
  name : string
  onShutdownCleanup? : Function
}