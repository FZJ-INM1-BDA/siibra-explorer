import { Component, Input, OnChanges } from '@angular/core'
import { SearchResultFileInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './fileViewer.template.html'
import css from './fileViewer.style.css'
@Component({
  selector : 'file-viewer',
  template ,
  styles : [ css ] 
})

export class FileViewer implements OnChanges{
  @Input() searchResult : SearchResultFileInterface
  constructor(){
  }

  ngOnChanges(){
  }
}