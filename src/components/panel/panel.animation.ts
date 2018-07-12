import { trigger, state, style, transition, animate } from "@angular/animations";


export const panelAnimations = trigger('collapseState',[
  state('collapsed', 
    style({ 
      'margin-top' : '-{{ fullHeight }}px'
    }),
    { params : { fullHeight : 9999 } }
  ),
  state('visible',
    style({ 
      'margin-top' : '0px'
    }),
    { params : { fullHeight : 0 } }
  ),
  transition('collapsed => visible',[
    animate('250ms ease-out')
  ]),
  transition('visible => collapsed',[
    animate('250ms ease-in')
  ])
])