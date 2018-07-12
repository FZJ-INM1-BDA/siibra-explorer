import { trigger, state, style, transition, animate } from "@angular/animations";


export const mainSideAnimation = trigger('collapseSide',[
  state('collapsed',
    style({
      'flex-basis' : '0px',
      'width' : '0px'
    }),
    { params : { sideWidth : 0 } }
  ),
  state('visible',
    style({
      'flex-basis' : '{{ sideWidth }}px',
      'width' : '{{ sideWidth }}px'
    }),
    { params : { sideWidth : 300 } }
  ),
  transition('collapsed => visible',[
    animate('180ms ease-out')
  ]),
  transition('visible => collapsed',[
    animate('180ms ease-in')
  ])
])