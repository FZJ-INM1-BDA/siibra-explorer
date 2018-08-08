import { trigger, state, style, transition, animate } from "@angular/animations";


export const regionAnimation = trigger('showState',[
  state('*',
    style({
      opacity : '1.0'
    })
  ),
  state('void',
    style({
      opacity : '0.0',
      'pointer-events':'none'
    })
  ),
  transition('* => void', [
    animate('2300ms ease-in')
  ]),
  transition('void => *',[
    animate('230ms ease-out')
  ])
])