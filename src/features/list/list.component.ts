import { Component, EventEmitter, Output } from '@angular/core';
import { SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { ListDirective } from './list.directive';

@Component({
  selector: 'sxplr-feature-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  exportAs: "featureList"
})
export class ListComponent extends ListDirective {

  @Output()
  onClickFeature = new EventEmitter<Feature>()

  constructor(sapi: SAPI) {
    super(sapi)
  }

  onClickItem(feature: Feature){
    this.onClickFeature.emit(feature)
  }
}
