import { animate, state, style, transition, trigger } from "@angular/animations";

export const mainSideAnimation = trigger('collapseSide', [
  state('collapsed',
    style({
      'flex-basis' : '0px',
      'width' : '0px',
    }),
    { params : { sideWidth : 0, animationTiming: 180 } },
  ),
  state('visible',
    style({
      'flex-basis' : '{{ sideWidth }}px',
      'width' : '{{ sideWidth }}px',
    }),
    { params : { sideWidth : 300, animationTiming: 180 } },
  ),
  transition('collapsed => visible', [
    animate('{{ animationTiming }}ms ease-out'),
  ]),
  transition('visible => collapsed', [
    animate('{{ animationTiming }}ms ease-in'),
  ]),
])
