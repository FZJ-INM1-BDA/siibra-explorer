import { animate, state, style, transition, trigger } from "@angular/animations";

export const dropdownAnimation = trigger('showState', [
  state('show',
    style({
      opacity : '1.0',
    }),
  ),
  state('hide',
    style({
      "opacity" : '0.0',
      'pointer-events': 'none',
    }),
  ),
  transition('show => hide', [
    animate('230ms ease-in'),
  ]),
  transition('hide => show', [
    animate('230ms ease-out'),
  ]),
])
