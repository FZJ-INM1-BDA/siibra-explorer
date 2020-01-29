import {
  animate,
  AnimationTriggerMetadata,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations'

export const readmoreAnimations: AnimationTriggerMetadata = trigger('collapseState', [
  state('collapsed',
    style({ height : '{{ collapsedHeight }}px' }),
    { params : { collapsedHeight : 45, fullHeight : 200, animationLength: 180 } },
  ),
  state('visible',
    style({ height : '*' }),
    { params : { collapsedHeight : 45, fullHeight : 200, animationLength: 180 } },
  ),
  transition('collapsed => visible', [
    animate('{{ animationLength }}ms', style({
      height : '{{ fullHeight }}px',
    })),
  ]),
  transition('visible => collapsed', [
    animate('{{ animationLength }}ms'),
  ]),
])
