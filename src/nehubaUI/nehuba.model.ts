import { Config as Nehubaconfig } from 'nehuba/exports'

export class FetchedTemplates {
    constructor(){
        this.templates = []
    }
    templates : TemplateDescriptor[];
}

export class TemplateDescriptor {
    constructor(name:string){
        this.name = name
        this.parcellations = []
        this.properties = {}
    }
    name : string;
    getUrl : string;
    parcellations : ParcellationDescriptor[];
    properties : any;
    
    nehubaConfig : Nehubaconfig;
}

export class ParcellationDescriptor {
    constructor(name:string){
        this.name = name
        this.regions = []
        this.properties = {}
    }
    regions : RegionDescriptor[];
    name : string;
    getUrl : string;
    properties : any;

    nehubaConfig : Nehubaconfig;
}

export class Multilevel{

    name : string; /* should be overwritten by subclasses */

    enabled : boolean = false;

    hierarchy : number;
    parent : Multilevel | undefined;
    children : Multilevel[];
    isExpanded : boolean = false;
    isExpandedString : 'expanded' | 'collapsed' = 'collapsed'
    isVisible : boolean = true

    constructor(){
        this.enabled = false
        this.children = []
    }

    public updateChildrenStatus( status:string ):void{
        switch( status ){
            case 'enable':{
                this.enabled = true
                if( this.children ){
                    this.children.forEach( child => {
                        child.updateChildrenStatus('enable')
                    })
                }
            }break;
            case 'disable':{
                this.enabled = false
                if( this.children ){
                    this.children.forEach( child => {
                        child.updateChildrenStatus('disable')
                    })
                }
            }break;
        }
    }

    public hasDisabledChildren():boolean{
        if ( this.children.length > 0 ){
            return this.children.some( child =>{
                return child.hasDisabledChildren()
            })
        } else {
            return !this.enabled
        }
    }

    public hasEnabledChildren():boolean{
        if ( this.children.length > 0 ){
            return this.children.some( child =>{
                return child.hasEnabledChildren()
            })
        } else {
            return this.enabled
        }
    }

    public hasVisibleChildren():boolean{
        if ( this.children.length > 0){
            return this.children.some( child =>{
                return this.isVisible || child.hasVisibleChildren()
            } )
        } else{
            return this.isVisible
        }
    }
}

export class RegionDescriptor extends Multilevel{

    constructor(name:string){
        super()
        this.name = name
        this.properties = {}
    }

    children : RegionDescriptor[] = []
    name : string;
    properties : any;
    getUrl: string;
}
