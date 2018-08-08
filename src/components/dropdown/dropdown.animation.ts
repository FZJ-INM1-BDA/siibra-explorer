import { trigger, state, style, transition, animate } from "@angular/animations";


export const dropdownAnimation = trigger('showState',[
  state('show',
    style({
      opacity : '1.0'
    })
  ),
  state('hide',
    style({
      opacity : '0.0'
    })
  ),
  transition('show => hide', [
    animate('150ms ease-in')
  ]),
  transition('hide => show',[
    animate('150ms ease-out')
  ])
])