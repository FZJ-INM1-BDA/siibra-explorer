import { Component, OnDestroy, OnInit } from '@angular/core'
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { isIdentityQuat } from 'src/viewerModule/nehuba/util';
import { atlasSelection, userPreference, userInterface } from 'src/state';
import { environment } from "src/environments/environment"

const ROOT_TEXT_ORDER: [string, string, string, string] = ['Coronal', 'Sagittal', 'Axial', '3D']
const OBLIQUE_ROOT_TEXT_ORDER: [string, string, string, string] = ['Slice View 1', 'Slice View 2', 'Slice View 3', '3D']

@Component({
  selector: 'viewer-preferences-component',
  templateUrl: './viewerPreferences.template.html',
  styleUrls: [
    './viewerPreferences.style.css',
  ],
})

export class ViewerPreferencesComponent implements OnInit, OnDestroy {


  public experimentalFlag = environment.EXPERIMENTAL_FEATURE_FLAG

  public panelModes: Record<string, userInterface.PanelMode> = {
    FOUR_PANEL: "FOUR_PANEL",
    H_ONE_THREE: "H_ONE_THREE",
    SINGLE_PANEL: "SINGLE_PANEL",
    V_ONE_THREE: "V_ONE_THREE",
  }


  private subscriptions: Subscription[] = []

  public panelMode$: Observable<string>

  private panelOrder: string
  private panelOrder$: Observable<string>
  public panelTexts$: Observable<[string, string, string, string]>

  private viewerObliqueRotated$: Observable<boolean>

  constructor(
    private store: Store<any>,
  ) {

    this.panelMode$ = this.store.pipe(
      select(userInterface.selectors.panelMode)
    )

    this.panelOrder$ = this.store.pipe(
      select(userInterface.selectors.panelOrder),
    )

    this.viewerObliqueRotated$ = this.store.pipe(
      select(atlasSelection.selectors.navigation),
      map(navigation => (navigation && navigation.orientation) || [0, 0, 0, 1]),
      debounceTime(100),
      map(isIdentityQuat),
      map(flag => !flag),
      distinctUntilChanged(),
    )

    this.panelTexts$ = combineLatest([
      this.panelOrder$.pipe(
        map(string => string.split('').map(s => Number(s))),
      ),
      this.viewerObliqueRotated$,
    ]).pipe(
      map(([arr, isObliqueRotated]) => arr.map(idx => (isObliqueRotated ? OBLIQUE_ROOT_TEXT_ORDER : ROOT_TEXT_ORDER)[idx]) as [string, string, string, string]),
      startWith(ROOT_TEXT_ORDER),
    )
  }

  public ngOnInit() {
    this.subscriptions.push(
      this.panelOrder$.subscribe(panelOrder => this.panelOrder = panelOrder),
    )
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe())
  }

  public usePanelMode(panelMode: userInterface.PanelMode) {

    this.store.dispatch(
      userInterface.actions.setPanelMode({
        panelMode
      })
    )
  }

  public handleDrop(event: DragEvent) {
    event.preventDefault()
    const droppedAttri = (event.target as HTMLElement).getAttribute('panel-order')
    const draggedAttri = event.dataTransfer.getData('text/plain')
    if (droppedAttri === draggedAttri) { return }
    const idx1 = Number(droppedAttri)
    const idx2 = Number(draggedAttri)
    const arr = this.panelOrder.split('');

    [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]]
    this.store.dispatch(
      userInterface.actions.setPanelOrder({
        order: arr.join('')
      })
    )
  }
  public handleDragOver(event: DragEvent) {
    event.preventDefault()
    const target = (event.target as HTMLElement)
    target.classList.add('onDragOver')
  }
  public handleDragLeave(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('onDragOver')
  }
  public handleDragStart(event: DragEvent) {
    const target = (event.target as HTMLElement)
    const attri = target.getAttribute('panel-order')
    event.dataTransfer.setData('text/plain', attri)

  }
  public handleDragend(event: DragEvent) {
    const target = (event.target as HTMLElement)
    target.classList.remove('onDragOver')
  }

  // public stepSize: number = 10
}
