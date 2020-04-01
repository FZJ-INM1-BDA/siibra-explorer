import { Component, Input, OnInit, OnChanges, TemplateRef } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { LoggingService } from "src/logging";
import { CHANGE_NAVIGATION, IavRootStoreInterface, ViewerStateInterface } from "src/services/stateStore.service";
import { NehubaViewerUnit } from "../nehubaViewer/nehubaViewer.component";
import { Observable, Subscription, of, combineLatest, BehaviorSubject } from "rxjs";
import { distinctUntilChanged, shareReplay, map, filter, startWith } from "rxjs/operators";
import { MatBottomSheet } from "@angular/material/bottom-sheet";

@Component({
  selector : 'ui-status-card',
  templateUrl : './statusCard.template.html',
  styleUrls : ['./statusCard.style.css'],
})
export class StatusCardComponent implements OnInit, OnChanges{

  @Input() public selectedTemplateName: string;
  @Input() public isMobile: boolean;
  @Input() public nehubaViewer: NehubaViewerUnit;

  private selectedTemplateRoot$: Observable<any>
  private selectedTemplateRoot: any
  private subscriptions: Subscription[] = []

  public navVal$: Observable<string>
  public mouseVal$: Observable<string>

  constructor(
    private store: Store<ViewerStateInterface>,
    private log: LoggingService,
    private store$: Store<IavRootStoreInterface>,
    private bottomSheet: MatBottomSheet
  ) {
    const viewerState$ = this.store$.pipe(
      select('viewerState'),
      shareReplay(1),
    )
    this.selectedTemplateRoot$ = viewerState$.pipe(
      select('fetchedTemplates'),
      distinctUntilChanged(),
    )
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.selectedTemplateRoot$.subscribe(template => {
        this.selectedTemplateRoot = template.find(t => t.name === this.selectedTemplateName)
      })
    )
  }

  ngOnChanges() {
    if (!this.nehubaViewer) {
      this.navVal$ = of(`neubaViewer is undefined`)
      this.mouseVal$ = of(`neubaViewer is undefined`)
      return
    }
    this.navVal$ = combineLatest(
      this.statusPanelRealSpace$,
      this.nehubaViewer.viewerPosInReal$.pipe(
        filter(v => !!v)
      ),
      this.nehubaViewer.viewerPosInVoxel$.pipe(
        filter(v => !!v)
      )
    ).pipe(
      map(([realFlag, real, voxel]) => realFlag
        ? real.map(v => `${ (v / 1e6).toFixed(3) }mm`).join(', ')
        : voxel.map(v => v.toFixed(3)).join(', ') ),
      startWith(`nehubaViewer initialising`)
    )

    this.mouseVal$ = combineLatest(
      this.statusPanelRealSpace$,
      this.nehubaViewer.mousePosInReal$.pipe(
        filter(v => !!v)
      ),
      this.nehubaViewer.mousePosInVoxel$.pipe(
        filter(v => !!v)
      )
    ).pipe(
      map(([realFlag, real, voxel]) => realFlag
        ? real.map(v => `${ (v/1e6).toFixed(3) }mm`).join(', ')
        : voxel.map(v => v.toFixed(3)).join(', s')),
      startWith(``)
    )
  }

  public statusPanelRealSpace$ = new BehaviorSubject(true)
  public statusPanelRealSpace: boolean = true

  public textNavigateTo(string: string) {
    if (string.split(/[\s|,]+/).length >= 3 && string.split(/[\s|,]+/).slice(0, 3).every(entry => !isNaN(Number(entry.replace(/mm/, ''))))) {
      const pos = (string.split(/[\s|,]+/).slice(0, 3).map((entry) => Number(entry.replace(/mm/, '')) * (this.statusPanelRealSpace ? 1000000 : 1)))
      this.nehubaViewer.setNavigationState({
        position : (pos as [number, number, number]),
        positionReal : this.statusPanelRealSpace,
      })
    } else {
      this.log.log('input did not parse to coordinates ', string)
    }
  }

  showBottomSheet(tmpl: TemplateRef<any>){
    this.bottomSheet.open(tmpl)
  }

  /**
   * TODO
   * maybe have a nehuba manager service
   * so that reset navigation logic can stay there
   *
   * When that happens, we don't even need selectTemplate input
   *
   * the info re: nehubaViewer can stay there, too
   */
  public resetNavigation({rotation: rotationFlag = false, position: positionFlag = false, zoom : zoomFlag = false}: {rotation?: boolean, position?: boolean, zoom?: boolean}) {
    const initialNgState = this.selectedTemplateRoot.nehubaConfig.dataset.initialNgState // d sa dsa

    const perspectiveZoom = initialNgState ? initialNgState.perspectiveZoom : undefined
    const perspectiveOrientation = initialNgState ? initialNgState.perspectiveOrientation : undefined
    const zoom = (zoomFlag
      && initialNgState
      && initialNgState.navigation
      && initialNgState.navigation.zoomFactor)
      || undefined

    const position = (positionFlag
      && initialNgState
      && initialNgState.navigation
      && initialNgState.navigation.pose
      && initialNgState.navigation.pose.position.voxelCoordinates
      && initialNgState.navigation.pose.position.voxelCoordinates)
      || undefined

    const orientation = rotationFlag
      ? [0, 0, 0, 1]
      : undefined

    this.store.dispatch({
      type : CHANGE_NAVIGATION,
      navigation : {
        ...{
          perspectiveZoom,
          perspectiveOrientation,
          zoom,
          position,
          orientation,
        },
        ...{
          positionReal : false,
          animation : {},
        },
      },
    })
  }
}
