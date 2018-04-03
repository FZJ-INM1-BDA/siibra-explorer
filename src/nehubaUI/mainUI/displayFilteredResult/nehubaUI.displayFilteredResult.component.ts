import { Component, Input, Output, EventEmitter } from "@angular/core";
import { DatasetInterface } from "nehubaUI/nehuba.model";

import template from './nehubaUI.displayFilteredResult.template.html'

@Component({
  selector : `display-filtered-result`,
  template : template
})
export class DisplayFilteredResult{
  @Input() filteredResult : FilteredResultInterface
  @Input() dismiss : boolean = false
  @Output() dismissEmitter : EventEmitter<any> = new EventEmitter()
}

export interface FilteredResultInterface{
  title : string
  dataset : DatasetInterface
}