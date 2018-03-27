import { trigger, transition, state, style, animate } from '@angular/animations'

export const animationFadeInOut = 
  trigger('animationFadeInOut',[
    state('void',style({'opacity' : '0.0'})),
    state('*',style({'opacity' : '1.0'})),
    transition('void => *',[
      style({'opacity':'0.0'}),
      animate('100ms',style({'opacity':'1.0'}))
    ]),
    transition('* => void',[
      style({'opacity':'1.0'}),
      animate('100ms',style({'opacity':'0.0'}))
    ])
  ])

export const animateCollapseShow = 
  trigger('animateCollapseShow',[
    state('collapse',style({
      'transform':'translateY(-100%)',
      'height':'0px'
    })),
    state('show',style({
      'transform':'translateY(0px)',
      'height':'*'
    })),
    transition('collapse => show',[
      animate('100ms',style({
        'transform':'translateY(0px)',
        'height':'*'
      }))
    ]),
    transition('show => collapse',[
      animate('100ms',style({
        'transform':'translateY(-100%)',
        'height':'0px'
      }))
    ])
  ])

export const showSideBar = 
  trigger('showSideBar',[
    state('0',style({'width':'0px'})),
    state('1',style({'width':'350px'})),
    transition('0 => 1',[
      style({'width':'0px'}),
      animate('500ms ease',style({'width':'350px'}))
    ]),
    transition('1 => 0',[
      style({'width':'350px'}),
      animate('500ms ease',style({'width':'0px'}))
    ])
  ])