import { Component, Input } from '@angular/core'
import { SearchResultFileInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './fileViewer.template.html'
import css from './fileViewer.style.css'
@Component({
  selector : 'file-viewer',
  template ,
  styles : [ css ] 
})

export class FileViewer{
  @Input() searchResult : SearchResultFileInterface
  constructor(){
    
  }
}