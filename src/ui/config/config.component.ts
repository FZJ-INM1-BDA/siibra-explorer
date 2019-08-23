import { Component, OnInit, OnDestroy } from '@angular/core'
import { Store, select } from '@ngrx/store';
import { ViewerConfiguration, ACTION_TYPES } from 'src/services/state/viewerConfig.store'
import { Observable, Subscription } from 'rxjs';
import { map, distinctUntilChanged, startWith, shareReplay } from 'rxjs/operators';
import { MatSlideToggleChange, MatSliderChange } from '@angular/material';
import { NG_VIEWER_ACTION_TYPES, SUPPORTED_PANEL_MODES } from 'src/services/state/ngViewerState.store';

const GPU_TOOLTIP = `GPU TOOLTIP`
const ANIMATION_TOOLTIP = `ANIMATION_TOOLTIP`
const ROOT_TEXT_ORDER = ['Coronal', 'Sagittal', 'Axial', '3D']

@Component({
  selector: 'config-component',
  templateUrl: './config.template.html',
  styleUrls: [
    './config.style.css'
  ]
})

export class ConfigComponent implements OnInit, OnDestroy{

  public GPU_TOOLTIP = GPU_TOOLTIP
  public ANIMATION_TOOLTIP = ANIMATION_TOOLTIP
  public supportedPanelModes = SUPPORTED_PANEL_MODES

  /**
   * in MB
   */
  public gpuLimit$: Observable<number>

  public animationFlag$: Observable<boolean>
  private subscriptions: Subscription[] = []

  public gpuMin : number = 100
  public gpuMax : number = 1000

  public panelMode$: Observable<string>
  public panelOrder$: Observable<[number, number, number, number]>
  public panelTexts$: Observable<[string, string, string, string]>

  constructor(private store: Store<ViewerConfiguration>) {
    this.gpuLimit$ = this.store.pipe(
      select('viewerConfigState'),
      map((config:ViewerConfiguration) => config.gpuLimit),
      distinctUntilChanged(),
      map(v => v / 1e6)
    )

    this.animationFlag$ = this.store.pipe(
      select('viewerConfigState'),
      map((config:ViewerConfiguration) => config.animation),
    )

    this.panelMode$ = this.store.pipe(
      select('ngViewerState'),
      select('panelMode'),
      startWith(SUPPORTED_PANEL_MODES[0])
    )

    this.panelOrder$ = this.store.pipe(
      select('ngViewerState'),
      select('panelOrder'),
      map(string => string.split('').map(s => Number(s)))
    )
    
    this.panelTexts$ = this.panelOrder$.pipe(
      map(arr => arr.map(idx => ROOT_TEXT_ORDER[idx]) as [string, string, string, string])
    )
  }

  ngOnInit(){
  }

  ngOnDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public toggleAnimationFlag(ev: MatSlideToggleChange ){
    const { checked } = ev
    this.store.dispatch({
      type: ACTION_TYPES.UPDATE_CONFIG,
      config: {
        animation: checked
      }
    })
  }

  public handleMatSliderChange(ev:MatSliderChange){
    this.store.dispatch({
      type: ACTION_TYPES.UPDATE_CONFIG,
      config: {
        gpuLimit: ev.value * 1e6
      }
    })
  }
  usePanelMode(panelMode: string){
    this.store.dispatch({
      type: NG_VIEWER_ACTION_TYPES.SWITCH_PANEL_MODE,
      payload: { panelMode }
    })
  }

  handleDrop(event:DragEvent){
    const droppedAttri = (event.target as HTMLElement).getAttribute('panel-order')
    const draggedAttri = event.dataTransfer.getData('text/plain')
    console.log({droppedAttri, draggedAttri})
  }
  handleDragOver(event){
    event.preventDefault()
  }
  handleDragStart(event:DragEvent){
    const attri = (event.target as HTMLElement).getAttribute('panel-order')
    event.dataTransfer.setData('text/plain', attri)
  }

  public stepSize: number = 10
}