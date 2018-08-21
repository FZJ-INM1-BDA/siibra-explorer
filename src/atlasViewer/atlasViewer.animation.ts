import { trigger, transition, animate, style } from "@angular/animations";

export const colorAnimation = trigger('newEvent',[
  transition('* => *', [
    animate('180ms ease-in', style({
      'opacity' : '1.0'
    })),
    animate('380ms ease-out', style({
      'opacity' : '0.0'
    }))
  ])
])