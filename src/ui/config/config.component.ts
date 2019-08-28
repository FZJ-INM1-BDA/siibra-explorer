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
  
  private panelOrder: string
  private panelOrder$: Observable<string>
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
      select('panelOrder')
    )
    
    this.panelTexts$ = this.panelOrder$.pipe(
      map(string => string.split('').map(s => Number(s))),
      map(arr => arr.map(idx => ROOT_TEXT_ORDER[idx]) as [string, string, string, string])
    )
  }

  ngOnInit(){
    this.subscriptions.push(
      this.panelOrder$.subscribe(panelOrder => this.panelOrder = panelOrder)
    )
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
    event.preventDefault()
    const droppedAttri = (event.target as HTMLElement).getAttribute('panel-order')
    const draggedAttri = event.dataTransfer.getData('text/plain')
    if (droppedAttri === draggedAttri) return
    const idx1 = Number(droppedAttri)
    const idx2 = Number(draggedAttri)
    const arr = this.panelOrder.split('');

    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]]
    this.store.dispatch({
      type: NG_VIEWER_ACTION_TYPES.SET_PANEL_ORDER,
      payload: { panelOrder: arr.join('') }
    })
  }
  handleDragOver(event:DragEvent){
    event.preventDefault()
    const target = (event.target as HTMLElement)
    target.classList.add('onDragOver')
  }
  handleDragLeave(event:DragEvent){
    (event.target as HTMLElement).classList.remove('onDragOver')
  }
  handleDragStart(event:DragEvent){
    const target = (event.target as HTMLElement)
    const attri = target.getAttribute('panel-order')
    event.dataTransfer.setData('text/plain', attri)
    
  }
  handleDragend(event:DragEvent){
    const target = (event.target as HTMLElement)
    target.classList.remove('onDragOver')
  }

  public stepSize: number = 10
}