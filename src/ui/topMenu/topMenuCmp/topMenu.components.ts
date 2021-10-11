import {
  ChangeDetectionStrategy,
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "src/auth";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { CONST, QUICKTOUR_DESC, ARIA_LABELS } from 'common/constants'
import { IQuickTourData } from "src/ui/quickTour/constrants";
import { environment } from 'src/environments/environment'

@Component({
  selector: 'top-menu-cmp',
  templateUrl: './topMenu.template.html',
  styleUrls: [
    './topMenu.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TopMenuCmp {

  public EXPERIMENTAL_FEATURE_FLAG = environment.EXPERIMENTAL_FEATURE_FLAG

  public ARIA_LABELS = ARIA_LABELS
  public PINNED_DATASETS_BADGE_DESC = CONST.PINNED_DATASETS_BADGE_DESC

  public matBtnStyle = 'mat-icon-button'
  public matBtnColor = 'primary'

  private _ismobile = false
  @Input()
  set ismobile(val) {
    this._ismobile = val
    this.matBtnStyle = this._ismobile ? 'mat-mini-fab' : 'mat-icon-button'
    this.matBtnColor = this._ismobile ? 'accent' : 'primary'
  }
  get ismobile(){
    return this._ismobile
  }

  @Input() public darktheme: boolean
  @Input() public viewerLoaded: boolean

  public user$: Observable<any>
  public userBtnTooltip$: Observable<string>
  public favDataEntries$: Observable<Partial<any>[]>

  public pluginTooltipText: string = `Plugins and Tools`
  public screenshotTooltipText: string = 'Take screenshot'
  public annotateTooltipText: string = 'Start annotating'
  public keyFrameText = `Start KeyFrames`
  
  public quickTourData: IQuickTourData = {
    description: QUICKTOUR_DESC.TOP_MENU,
    order: 8,
  }

  public pinnedDsNotAvail = 'We are reworking pinned dataset feature. Please check back later.'
  @ViewChild('savedDatasets', { read: TemplateRef })
  private savedDatasetTmpl: TemplateRef<any>

  public openPinnedDatasets(){
    // this.bottomSheet.open(this.savedDatasetTmpl)
  }

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    public bottomSheet: MatBottomSheet,
  ) {
    this.user$ = this.authService.user$

    this.userBtnTooltip$ = this.user$.pipe(
      map(user => user
        ? `Logged in as ${(user && user.name) ? user.name : 'Unknown name'}`
        : `Not logged in`),
    )

    this.favDataEntries$ = of([])
  }

  private dialogRef: MatDialogRef<any>
  public helperOnePagerConfig = {
    panelClass: ['col-lg-10']
  }

  public openTmplWithDialog(tmpl: TemplateRef<any>, overwriteConfig?: Partial<MatDialogConfig>) {
    this.dialogRef && this.dialogRef.close()

    if (tmpl) {
      this.dialogRef = this.dialog.open(tmpl, {
        autoFocus: false,
        panelClass: ['col-12', 'col-sm-12', 'col-md-8', 'col-lg-6', 'col-xl-4'],
        ...overwriteConfig
      })
    }
  }

  private keyListenerConfigBase = {
    type: 'keydown',
    stop: true,
    target: 'document',
  }

  public keyListenerConfig = [{
    key: 'h',
    capture: true,
    ...this.keyListenerConfigBase,
  }, {
    key: 'H',
    capture: true,
    ...this.keyListenerConfigBase,
  }, {
    key: '?',
    ...this.keyListenerConfigBase,
  }]
}
