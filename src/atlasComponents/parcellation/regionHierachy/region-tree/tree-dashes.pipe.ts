import { Pipe, PipeTransform } from '@angular/core';
import {DomSanitizer, SafeStyle} from "@angular/platform-browser";

@Pipe({
  name: 'treeDashes'
})
export class TreeDashesPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(node: any, isLast: boolean, index: number, expanded: boolean): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`
    ${isLast? 'border-bottom: 1px dashed;' : ''} 
    ${!node['missBorderPaintingLevels'] || !node['missBorderPaintingLevels'].includes(index+1)? 'border-left: 1px dashed;' : ''}
    ${node.hasChildren? !expanded? 'margin-top: -9px;' : 'margin-top: -2px;' : 'margin-top: -8px;'}
    `)
  }

}
