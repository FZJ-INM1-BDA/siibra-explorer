import { Pipe,PipeTransform,SecurityContext } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { Multilevel } from './nehuba.model'
/* pipes in object, pipes out stringified json  */

@Pipe({
  name:'jsonStringifyPipe'
})

export class JsonStringifyPipe implements PipeTransform{
  public transform(json:any){
    return JSON.stringify(json)
  }
}

@Pipe({
  name : 'multilevelHasVisibleChildren'
})

export class MultilevelHasVisibleChildren implements PipeTransform{
  public transform(multilevels:Multilevel[],searchTerm:string):Multilevel[]{
    /* needs searchTerm to update *ngFor loop */
    searchTerm
    return multilevels.filter(multilevel=>multilevel.hasVisibleChildren())
  }
}

/* pipes in string, pipes out json objects */

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
      return {}
    }
  }
}

/* pipes in object and pipes out list of keys */
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

/* searches tree array object (assuming children nodes are nested under children property) */
/* ignores blank spaces */
/* supercedes searchPipe */

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

/* search high lighting */

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
      let sanitaized = searchTerm.replace(/[^\w\s]/gi, '')
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

/* round float to 3 dp */
/* originally used for navigation panel */

@Pipe({
  name:'numberfilteringPipe'
})

export class NumberFilteringPipe implements PipeTransform{
  public transform(number:number){
    return number.toFixed(2)
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

@Pipe({
  name : 'nmToMm'
})

export class NmToMmPipe implements PipeTransform{

  public transform(number:any):number{
    return isNaN(number) ? 
      0 :
      number / 1000000
  }
}

@Pipe({
  name : 'arrayJoinComma'
})

export class ArrayJoinComma implements PipeTransform{
  public transform(array:any[]){
    return array.join(',')
  }
}

// @Pipe({
//   name:'htmlElementAssemblerPipe'
// })

// export class HTMLElementAssemblerPipe implements PipeTransform{
//   public transform(data:any){
//     let element : HTMLElement
//     if ( data._elementTagName ){
//       switch( data._elementTagName ){
//         case 'img':{
//           element = document.createElement('img')
//           if( data._src ){
//             element.setAttribute('src',data._src)
//           }
//         }break;
//         case 'span':{
//           element = document.createElement('span')
//         }break; 
//         case 'div':
//         default :{
//           element = document.createElement('div')
//         }break;
//       }
//       if( data._class ){
//         element.className = data._class
//       }
//       if ( data._id ){
//         element.id = data._id
//       }
//       if (data._value){
//         element.innerHTML = data._value
//       }

//       return element.outerHTML
//     }else{
//       return ''
//     }
//   }
// }

@Pipe({
  name:'isEmpty'
})

export class IsEmpty implements PipeTransform{
  public transform(thing:any|any[]):boolean{
    return thing.constructor.name == 'String' ? thing.length == 0 : 
      thing.constructor.name == 'Array' ? thing.length == 0 :
      thing.constructor.name == 'Object' ? Object.keys(thing).length == 0 :
      true
  }
}