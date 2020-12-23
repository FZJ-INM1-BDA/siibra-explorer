import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  TemplateRef,
} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "src/auth";
import { IavRootStoreInterface, IDataEntry } from "src/services/stateStore.service";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { CONST } from 'common/constants'

@Component({
  selector: 'signin-banner',
  templateUrl: './signinBanner.template.html',
  styleUrls: [
    './signinBanner.style.css',
    '../btnShadow.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SigninBanner {

  public PINNED_DATASETS_BADGE_DESC = CONST.PINNED_DATASETS_BADGE_DESC

  public matBtnStyle = ''
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
  @Input() public parcellationIsSelected: boolean

  public user$: Observable<any>
  public userBtnTooltip$: Observable<string>
  public favDataEntries$: Observable<Partial<IDataEntry>[]>

  public pluginTooltipText: string = `Plugins and Tools`
  public screenshotTooltipText: string = 'Take screenshot'

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private authService: AuthService,
    private dialog: MatDialog,
    public bottomSheet: MatBottomSheet,
    private changeDetectionRef: ChangeDetectorRef,
  ) {
    this.user$ = this.authService.user$

    this.userBtnTooltip$ = this.user$.pipe(
      map(user => user
        ? `Logged in as ${(user && user.name) ? user.name : 'Unknown name'}`
        : `Not logged in`),
    )

    this.favDataEntries$ = this.store$.pipe(
      select('dataStore'),
      select('favDataEntries'),
    )
  }

  private dialogRef: MatDialogRef<any>

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
