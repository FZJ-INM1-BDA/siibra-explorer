import { Component, ViewChildren, QueryList, HostBinding, ViewChild, ElementRef, OnDestroy } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { distinctUntilChanged, map, withLatestFrom, shareReplay, mapTo } from "rxjs/operators";
import { merge, Observable, Subject, Subscription } from "rxjs";
import { MatMenuTrigger } from "@angular/material/menu";
import { ARIA_LABELS, CONST, QUICKTOUR_DESC } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { IHasId, OVERWRITE_SHOW_DATASET_DIALOG_TOKEN } from "src/util/interfaces";
import { CurrentTmplSupportsParcPipe } from "../pipes/currTmplSupportsParc.pipe";
import {
  actions,
  fromRootStore
} from "src/state/atlasSelection"
import { SAPI } from "src/atlasComponents/sapi";
import { atlasSelection } from "src/state";

@Component({
  selector: 'atlas-layer-selector',
  templateUrl: './atlasLayerSelector.template.html',
  styleUrls: ['./atlasLayerSelector.style.css'],
  exportAs: 'atlasLayerSelector',
  animations: [
    trigger('toggleAtlasLayerSelector', [
      state('false', style({
        transform: 'scale(0)',
        opacity: 0,
        transformOrigin: '0% 100%'
      })),
      state('true', style({
        transform: 'scale(1)',
        opacity: 1,
        transformOrigin: '0% 100%'
      })),
      transition('false => true', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ]),
      transition('true => false', [
        animate('200ms cubic-bezier(0.35, 0, 0.25, 1)')
      ])
    ])
  ],
  providers:[
    {
      provide: OVERWRITE_SHOW_DATASET_DIALOG_TOKEN,
      useValue: null
    }
  ]
})
export class AtlasLayerSelector implements OnDestroy {

  public ARIA_LABELS = ARIA_LABELS
  public CONST = CONST

  @ViewChildren(MatMenuTrigger)
  matMenuTriggers: QueryList<MatMenuTrigger>

  @ViewChild('selectorPanelTmpl', { read: ElementRef })
  selectorPanelTemplateRef: ElementRef

  public selectedAtlas$: Observable<any> = this.store$.pipe(
    select(atlasSelection.selectors.selectedAtlas),
    distinctUntilChanged(),
    shareReplay(1)
  )

  public atlasLayersLatest$ = this.store$.pipe(
    fromRootStore.allAvailParcs(this.sapi),
    shareReplay(1),
  )

  public availableTemplates$ = this.store$.pipe(
    fromRootStore.allAvailSpaces(this.sapi),
  )

  public selectedTemplate$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedTemplate),
    withLatestFrom(this.availableTemplates$),
    map(([selectedTmpl, fullInfoTemplates]) => {
      return fullInfoTemplates.find(t => t['@id'] === selectedTmpl['@id'])
    })
  )
  private showOverlayIntent$ = new Subject()
  public showLoadingOverlay$ = merge(
    this.showOverlayIntent$.pipe(
      mapTo(true)
    ),
    this.selectedTemplate$.pipe(
      mapTo(false)
    )
  ).pipe(
    distinctUntilChanged(),
  )

  public selectedParcellation$ = this.store$.pipe(
    select(atlasSelection.selectors.selectedParcellation),
  )

  private subscriptions: Subscription[] = []

  @HostBinding('attr.data-opened')
  public selectorExpanded: boolean = false
      
  public quickTourData: IQuickTourData = {
    order: 4,
    description: QUICKTOUR_DESC.LAYER_SELECTOR,
  }

  constructor(
    private store$: Store<any>,
    private sapi: SAPI,
  ) {}

  ngOnDestroy() {
    while(this.subscriptions.length) this.subscriptions.pop().unsubscribe()
  }


  toggleSelector() {
    this.selectorExpanded = !this.selectorExpanded
  }

  selectTemplatewithId(templateId: string) {
    this.showOverlayIntent$.next(true)
    this.store$.dispatch(
      actions.selectATPById({
        templateId
      })
    )
  }

  private currTmplSupportParcPipe = new CurrentTmplSupportsParcPipe()

  selectParcellationWithId(id: string) {
    this.store$.dispatch(
      actions.selectATPById({
        parcellationId: id
      })
    )
  }

  collapseExpandedGroup(){
    this.matMenuTriggers.forEach(t => t.menuOpen && t.closeMenu())
  }


  trackbyAtId(t: IHasId){
    return t['@id']
  }

  trackKeyVal(obj: {key: string, value: any}) {
    return obj.key
  }
}
