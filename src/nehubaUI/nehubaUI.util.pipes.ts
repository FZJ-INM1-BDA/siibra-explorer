import { Pipe,PipeTransform } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { SecurityContext } from '@angular/core'
import { Multilevel } from './nehuba.model'

/* experimental */

@Pipe({
    name:'jsonStringifyPipe'
})

export class JsonStringifyPipe implements PipeTransform{
    public transform(json:any){
        return JSON.stringify(json)
    }
}

@Pipe({
    name:'jsonParsePipe'
})

export class JsonParsePipe implements PipeTransform{
    public transform(string:string){
        let json
        try{
            json = JSON.parse(string)
            return json
        } catch (e){
            
        }
    }
}

/* experimental */

@Pipe({
    name:'searchPipe'
})

export class SearchPipe implements PipeTransform{
    public transform(array:any[],searchTerm:string){
        return array.filter( (item) => {
            if(searchTerm === ''){
                return true
            }else{
                let regExp = new RegExp('\\b'+searchTerm,'gi')
                return regExp.test(item.name)
            }
        })
    }
}

@Pipe({
    name:'keyPipe'
})

export class KeyPipe implements PipeTransform{
    public transform(obj:any):string[]{
        let returnKey = []
        for (let key in obj){
            returnKey.push(key)
        }
        return returnKey
    }
}

@Pipe({
    name:'searchTreePipe'
})

export class SearchTreePipe implements PipeTransform{

    searchTerm : string

    public transform(array:Multilevel[],searchTerm:string):Multilevel[]{
        this.searchTerm = searchTerm
        this.iteratingArray( array )
        return array
    }

    private iteratingArray(array:Multilevel[]){
        let sanitaized = this.searchTerm.replace(/[^\w\s]/gi, '')
        array.forEach( item => {
            /* if regexp is not here, it gives funny results */
            let regExp = new RegExp(sanitaized,'gi')
            item.isVisible = regExp.test( item.name )
            this.iteratingArray( item.children )
        })
    }
}

@Pipe({
    name:'searchHighlight'
})

export class SearchHighlight implements PipeTransform{
    
    regExp : RegExp

    constructor(private sanitizer:DomSanitizer){}

    public transform(string : string,searchTerm:string,singleData:any){
        if( searchTerm == '' ){
            return string
        }else{
            let sanitaized = searchTerm.replace(/[^\w\s]/gi, '')
            this.regExp = new RegExp(sanitaized,'gi')
            singleData
            return this.sanitizer.bypassSecurityTrustHtml( string.replace(this.regExp,match=>`<span class = "highlight">${this.sanitizer.sanitize(SecurityContext.HTML,match)}</span>`) )
        }
    }
}

@Pipe({
    name:'selectTreePipe',
    pure : false
})

export class SelectTreePipe implements PipeTransform{

    returnArray:any[]

    public transform(array:any[]):any[]{
        
        this.returnArray = []
        this.iterate(array)

        return this.returnArray
    }

    private iterate(array:any[]){
        array.forEach(item=>{
            if(item.children.length>0){
                this.iterate(item.children)
            }else{
                item.enabled ? this.returnArray.push( item ) : {}
            }
        })
    }
}

@Pipe({
    name:'numberfilteringPipe'
})

export class NumberFilteringPipe implements PipeTransform{
    public transform(number:number){
        return Math.round( number * 1000 ) / 1000
    }
}