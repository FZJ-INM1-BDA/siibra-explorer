import { Component, EventEmitter, Output } from '@angular/core';
import { SAPI } from 'src/atlasComponents/sapi';
import { Feature } from 'src/atlasComponents/sapi/sxplrTypes';
import { ListDirective } from './list.directive';
import { IsAlreadyPulling, PulledDataSource } from 'src/util/pullable';

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

  async onScroll(datasource: PulledDataSource<unknown>, scrollIndex: number){
    if ((datasource.currentValue.length - scrollIndex) < 30) {
      try {
        await datasource.pull()
      } catch (e) {
        if (e instanceof IsAlreadyPulling) {
          return
        }
        throw e
      }
    }
  }
}
