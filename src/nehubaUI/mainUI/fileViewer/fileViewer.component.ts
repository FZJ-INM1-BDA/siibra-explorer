import { Component, Input, OnChanges } from '@angular/core'
import { SearchResultFileInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';

import template from './fileViewer.template.html'
import css from './fileViewer.style.css'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';
import { MainController } from 'nehubaUI/nehubaUI.services';

@Component({
  selector : 'file-viewer',
  template ,
  styles : [ css ] 
})

export class FileViewer implements OnChanges{
  @Input() searchResultFile : SearchResultFileInterface

  constructor(private mainController:MainController){
  }

  ngOnChanges(){
  }

  transformRegionNameToRegionDescriptor(region:{regionName:string,relationship:string,moreInfo:string}):RegionDescriptor|undefined{
    return Array.from(this.mainController.regionsLabelIndexMap.values()).find(rd=>rd.name==region.regionName)
  }
}