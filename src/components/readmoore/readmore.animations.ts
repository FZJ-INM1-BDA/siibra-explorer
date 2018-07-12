import {
  trigger,
  state,
  style,
  transition,
  animate,
  AnimationTriggerMetadata
} from '@angular/animations'

export const readmoreAnimations : AnimationTriggerMetadata = trigger('collapseState',[
  state('collapsed',
    style({ 'height' : '{{ collapsedHeight }}px' }),
    { params : { collapsedHeight : 45, fullHeight : 200 } }
  ),
  state('visible',
    style({ 'height' : '{{ fullHeight }}px' }),
    { params : { collapsedHeight : 45, fullHeight : 200 } }
  ),
  transition('collapsed => visible',[
    animate('180ms')
  ]),
  transition('visible => collapsed',[
    animate('180ms')
  ])
])