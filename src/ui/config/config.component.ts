import { Component } from '@angular/core'
import { Store, select } from '@ngrx/store';
import { ViewerConfiguration, ACTION_TYPES } from 'src/services/state/viewerConfig.store'
import { Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'config-component',
  templateUrl: './config.template.html',
  styleUrls: [
    './config.style.css'
  ]
})

export class ConfigComponent{

  /**
   * in MB
   */
  public gpuLimit$: Observable<number>
  
  constructor(private store: Store<ViewerConfiguration>) {
    this.gpuLimit$ = this.store.pipe(
      select('viewerConfigState'),
      map((config:ViewerConfiguration) => config.gpuLimit),
      distinctUntilChanged(),
      map(v => v / 1e6)
    )
  }

  public wheelEvent(ev:WheelEvent) {
    const delta = ev.deltaY * -1e5
    this.store.dispatch({
      type: ACTION_TYPES.CHANGE_GPU_LIMIT,
      payload: { delta }
    })
  }

  public setGpuPreset({value}: {value: number}) {
    this.store.dispatch({
      type: ACTION_TYPES.UPDATE_CONFIG,
      config: {
        gpuLimit: value * 1e6
      }
    })
  }
}