import { Directive, Input, TemplateRef, OnDestroy } from '@angular/core';
import { SlServiceService } from './sl-service.service';

@Directive({
  selector: '[sl-spotlight]',
  exportAs: 'sl-spotlight'
})
export class SlSpotlightDirective {

  constructor(
    private slService:SlServiceService
  ) {
    
  }

  showBackdrop(tmpl?:TemplateRef<any>){
    this.slService.showBackdrop(tmpl)
  }
}
