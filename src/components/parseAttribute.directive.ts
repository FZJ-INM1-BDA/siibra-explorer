import { Directive, OnChanges, SimpleChanges } from "@angular/core";

// TODO deprecate this directive
function parseAttribute(arg: any, expectedType: string) {

  // if(
  //   typeof arg === expectedType ||
  //   arg === undefined ||
  //   arg === null
  // ){
  //   return arg
  // }
  // switch (expectedType){
  //   case 'object':
  //     try{
  //       const json =  JSON.parse(arg)
  //       return json
  //     }catch(e){
  //       this.log.warn('parseAttribute error, cannot JSON.parse object')
  //       return arg
  //     }
  //   case 'boolean' :
  //     return arg === 'true'
  //   case 'number':
  //     return isNaN(arg) ? 0 : Number(arg)

  //   case 'string':
  //   default :
  //     return arg
  // }

  /* return if empty string */
  if (
    arg === '' ||
    arg === undefined ||
    arg === null
  ) {
    return arg
  }

  if (!isNaN(arg)) {
    return Number(arg)
  }

  if (arg === 'true') {
    return true
  }

  if (arg === 'false') {
    return false
  }

  try {
    const json = JSON.parse(arg)
    return json
  } catch (e) {
    // this.log.warn('parseAttribute, parse JSON, not a json')
    /* not a json, continue */
    /* probably print in debug mode */
  }

  return arg
}

@Directive({
  selector : '[ivparseattribute]',
})

export class ParseAttributeDirective implements OnChanges {
  public ngOnChanges(simpleChanges: SimpleChanges) {
    Object.keys(simpleChanges).forEach(key => {
      this[key] = parseAttribute(simpleChanges[key].currentValue, typeof simpleChanges[key].previousValue)
    })
  }
}
