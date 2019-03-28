import { Component, OnInit, OnDestroy } from '@angular/core'
import { Store, select } from '@ngrx/store';
import { ViewerConfiguration, ACTION_TYPES } from 'src/services/state/viewerConfig.store'
import { Observable, Subject, Subscription } from 'rxjs';
import { map, distinctUntilChanged, debounce, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'config-component',
  templateUrl: './config.template.html',
  styleUrls: [
    './config.style.css'
  ]
})

export class ConfigComponent implements OnInit, OnDestroy{

  /**
   * in MB
   */
  public gpuLimit$: Observable<number>
  public keydown$: Subject<Event> = new Subject()
  private subscriptions: Subscription[] = []

  public gpuMin : number = 100
  public gpuMax : number = 1000
  
  constructor(private store: Store<ViewerConfiguration>) {
    this.gpuLimit$ = this.store.pipe(
      select('viewerConfigState'),
      map((config:ViewerConfiguration) => config.gpuLimit),
      distinctUntilChanged(),
      map(v => v / 1e6)
    )
  }

  ngOnInit(){
    this.subscriptions.push(
      this.keydown$.pipe(
        debounceTime(250)
      ).subscribe(ev => {
        /**
         * maybe greak in FF. ev.srcElement is IE non standard property
         */
        const val = (<HTMLInputElement>ev.srcElement).value
        const numVal = val && Number(val)
        if (isNaN(numVal) || numVal < this.gpuMin || numVal > this.gpuMax )
          return
        this.setGpuPreset({
          value: numVal
        })
      })
    )
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
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