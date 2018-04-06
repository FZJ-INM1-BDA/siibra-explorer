import { Config as Nehubaconfig } from 'nehuba/exports'
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

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
    
    this.asyncPromises = [(new Promise((resolve,reject)=>{
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
        return Promise.resolve()
      })
      .catch(e=>{
        console.log('constructing template error',e)
        return Promise.reject(e)
      })]
  }
  name : string;
  useTheme : string;
  parcellations : ParcellationDescriptor[];
  properties : any;
  nehubaId : string;
  
  nehubaConfig : Nehubaconfig;
  asyncPromises : Promise<any>[]
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

  hierarchy : number
  parent : Multilevel | undefined
  children : Multilevel[] = []
  isExpanded : boolean = true

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

    //TODO pmapurl, properties url and receptorData
    this.propertiesURL = json.PMapURL ? json.PMapURL.replace(/PMaps\/.*?\.nii$/,(s:string)=>`metadata2/${s.split(/\/|\./)[1]}.json`) : null

    /* populate moreInfo array */
    if(this.position){
      const goToPosition = new DescriptorMoreInfoItem('Go To There','map-marker')
      goToPosition.action = ()=>{
        INTERACTIVE_VIEWER.viewerHandle.moveToNavigationLoc(this.position as [number,number,number],true)
      }
      this.moreInfo.push(goToPosition)
    }
    if(this.PMapURL){
      const pmap = new DescriptorMoreInfoItem('Cytoarchitectonic Probabilistic Map','picture')
      pmap.action = () => {
        console.log('using action to access pmap has been deprecated')
      }
      pmap.source = 'nifti://'+this.PMapURL
      this.moreInfo.push(pmap)
    }

    if(json.receptorData){
      const receptorData = new DescriptorMoreInfoItem('Receptor Data','tag')
      receptorData.action = ()=>{
        console.log('using action to access receptor data has been depreciated')
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
  propertiesURL : string
  rgb : number[]

  moreInfo : DescriptorMoreInfoItem[] = []
}

export interface DescriptorMoreInfo{
  moreInfo : any[]
}

export class DescriptorMoreInfoItem{
  name : string
  desc : string
  icon : any
  source : string
  action : ()=>void = ()=>{}
  constructor(name:string,icon:string){
    this.name = name
    this.icon = icon
  }
}

export class LabComponent{
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

export interface WidgitiseTempRefMetaData{
  name : string
  onShutdownCleanup? : Function
}

export interface DatasetInterface{
  name : string
  description : string
  publications : Publication[]
}

export interface Publication{
  doi : string
  citation : string
}

/* interface required for region template refs to display */
export interface RegionTemplateRefInterface{
  region : RegionDescriptor
}