import { trigger, transition, state, style, animate } from '@angular/animations'

export const animationFadeInOut = 
  trigger('animationFadeInOut',[
    state('void',style({'opacity' : '0.33'})),
    state('*',style({'opacity' : '1.0'})),
    transition('void => *',[
      style({'opacity':'0.32'}),
      animate('550ms',style({'opacity':'1.0'}))
    ]),
    transition('* => void',[
      style({'opacity':'1.0'}),
      animate('550ms',style({'opacity':'0.31'}))
    ])
  ])

/* TODO investigate why the -12 top margin is required */
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
      animate('200ms 100ms ease-out',style({
        'transform':'translateY(0px)',
        'height':'*'
      }))
    ]),
    transition('show => collapse',[
      animate('200ms 100ms ease-in',style({
        'transform':'translateY(-100%)',
        'height':'0px'
      }))
    ])
  ])

export const showSideBar = 
  trigger('showSideBar',[
    state('0',style({
      'width':'350px',
      'margin-right':'-350px'
    })),
    state('1',style({
      'width':'350px',
      'margin-right':'0px'
    })),
    transition('0 => 1',[
      // style({'width':'0px'}),
      animate('500ms ease',style({
        'width':'350px',
        'margin-right':'0px'
      }))
    ]),
    transition('1 => 0',[
      // style({'width':'350px'}),
      animate('500ms ease',style({
        'width':'350px',
        'margin-right':'-350px'
      }))
    ])
  ])

export const showLandmarkHeight = 
  trigger('showLandmarkHeight',[
    state('0',
      style({ 'transform' : 'translate(0px, 0px) scale(1,0)' })),
    state('1',
      style({ 'transform' : 'translate(0px, {{ landmarkHeight }}px) scale(1,{{ landmarkScale }})' }), 
        { params : { landmarkHeight : 0 ,landmarkScale : 0 } }),
    transition('0 => 1',[
      animate('100ms',style({ 'transform' : 'translate(0px, {{ landmarkHeight }}px) scale(1,{{ landmarkScale }})' }))
    ]),
    transition('1 => 0',[
      animate('200ms ease-in',style({ 'transform' : 'translate(0px, 0px) scale(1,0)' }))
    ])
  ])

export const translateLandmarkHeight = 
  trigger('translateLandmarkHeight',[
    state('0',
      style({ 'transform' : 'translate(0px, 0px)' })),
    state('1',
      style({ 'transform' : 'translate(0px, {{ landmarkHeight }}px)' }), 
        { params : { landmarkHeight : 0 } }),
    transition('0 => 1',[
      animate('100ms',style({ 'transform' : 'translate(0px, {{ landmarkHeight }}px)' }))
    ]),
    transition('1 => 0',[
      animate('200ms ease-in',style({ 'transform' : 'translate(0px, 0px)' }))
    ])
  ])