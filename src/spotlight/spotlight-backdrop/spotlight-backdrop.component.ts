import { Component, HostListener, TemplateRef, HostBinding, Inject } from '@angular/core';
import { SlServiceService } from '../sl-service.service';
import { transition, animate, state, style, trigger } from '@angular/animations';
import { TMPL_INJ_TOKEN } from '../const';

@Component({
  selector: 'sl-spotlight-backdrop',
  templateUrl: './spotlight-backdrop.component.html',
  styleUrls: ['./spotlight-backdrop.component.css'],
  animations: [
    trigger('onShownOnDismiss', [
      state('void', style({
        opacity: 0.0
      })),
      state('*', style({
        opacity: 1.0
      })),
      transition('void => *', [
        animate('0.5s')
      ]),
      transition('* => void', [
        animate('0.5s')
      ])
    ])
  ]
})
export class SpotlightBackdropComponent {

  @HostBinding('@onShownOnDismiss')
  animation: string = 'attach'

  @HostListener('click', ['$event'])
  clickHandler(ev: MouseEvent){
    this.slService && this.slService.onClick.next(ev)
  }

  constructor(
    private slService: SlServiceService,
    @Inject(TMPL_INJ_TOKEN) public insert: TemplateRef<any>,
  ){
  }
}
