import { Component, Input } from '@angular/core'
import { DatasetInterface } from 'nehubaUI/nehuba.model';

import template from './nehubaUI.datasetBlurb.template.html'
import css from './nehubaUI.datasetBlurb.style.css'

@Component({
  selector : `datasetBlurb`,
  template : template,
  styles : [ css ]
})

export class DatasetBlurb{
  @Input() dataset:DatasetInterface
}

