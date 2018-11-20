import { trigger, state, style, transition, animate } from "@angular/animations";

export const toastAnimation = trigger('exists',[
  state('*', 
    style({
      height : '*',
      opacity : 1
    })),
  state('void',
    style({
      height: '0em',
      opacity : 0
    })),
  transition('* => void', animate('180ms ease-in')),
  transition('void => *', animate('180ms ease-out'))
])