import { Component, Input, EventEmitter, Output } from '@angular/core'

import template from './nehubaUI.collapsablePanel.template.html'
import css from './nehubaUI.collapsablePanel.style.css'
import { animateCollapseShow } from 'nehubaUI/util/nehubaUI.util.animations';

@Component({
  selector : 'collapsable-panel',
  template : template,
  styles : [css],
  animations : [animateCollapseShow]
})

export class CollapsablePanel{
  @Input() panelShow : boolean = false
  @Input() title : string = 'Untitled Panel'
  @Input() glyphiconButtons : GlyphiconButtonInterface[] = []
  @Output() glyphiconEvent : EventEmitter<[string,number]> = new EventEmitter()
}

export interface GlyphiconButtonInterface{
  bootstrapClass :string
  tooltip? : string
}