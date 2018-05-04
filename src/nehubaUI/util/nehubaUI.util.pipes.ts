import { Pipe,PipeTransform,SecurityContext } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { Multilevel } from 'nehubaUI/nehuba.model'

/* pipes in string, pipes out json objects */


/* pipes in object and pipes out list of keys */
@Pipe({
  name:'keyPipe'
})

export class KeyPipe implements PipeTransform{
  public transform(obj:any):string[]{
    if((typeof obj) != 'object') throw new Error('KeyPipe input is not an Object.')
    let returnKey = []
    for (let key in obj){
      returnKey.push(key)
    }
    return returnKey
  }
}

@Pipe({
  name : 'multilevelSelectorVisiblePipe'
})

export class MultilevelSelectorVisiblePipe implements PipeTransform{
  public transform(m:Multilevel,searchTerm:string):boolean{
    return this.iterate(m,searchTerm)
  }

  private iterate(m:Multilevel,searchTerm:string):boolean{
    /* https://stackoverflow.com/a/6969486/6059235 */
    const escaptedString = searchTerm.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,'\\$&')
    const regex = new RegExp(escaptedString,'gi')
    
    return m.children.length > 0 ? 
      regex.test(m.name) || m.children.some(mc=>this.iterate(mc,searchTerm)) :
      regex.test(m.name)
  }
}

@Pipe({
  name:'searchHighlight'
})

export class SearchHighlight implements PipeTransform{
  
  regExp : RegExp

  constructor(private sanitizer:DomSanitizer){}

  public transform(string : string,searchTerm:string){
    /* necessary as some region has no name defined */
    if( !string ){
      return null
    }
    if( !searchTerm || searchTerm == '' ){
      return string
    }else{
      
    /* https://stackoverflow.com/a/6969486/6059235 */
      let sanitaized = searchTerm.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,'\\$&')
      const nbsp = string.replace(/\s/gi,' ')
      this.regExp = new RegExp(sanitaized,'gi')
      return this.sanitizer.bypassSecurityTrustHtml( nbsp.replace(this.regExp,match=> `<span class = "highlight">${this.sanitizer.sanitize(SecurityContext.HTML,match)}</span>`))
    }
  }
}

/* searches for tree selected status (selected/unselected/partially selected) */

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
      if( item.enabled && item.labelIndex ) this.returnArray.push( item ) 
      if( item.children && item.children.length>0){
        this.iterate(item.children)
      }
    })
  }
}

/* if a field is undefined/null, set it to n/a instead */
@Pipe({
  name:'filterUncertainObject'
})

export class FilterUncertainObject implements PipeTransform{
  public transform(obj:any|any[]){
    if(!obj){
      return 'n/a'
    }else{
      return obj
    }
  }
}
