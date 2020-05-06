import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  TemplateRef,
  ViewChild
} from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "src/auth";
import { IavRootStoreInterface, IDataEntry } from "src/services/stateStore.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatBottomSheet} from "@angular/material/bottom-sheet";

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

  @Input() public darktheme: boolean
  @Input() public parcellationIsSelected: boolean

  @ViewChild('takeScreenshotElement', {read: ElementRef}) takeScreenshotElement: ElementRef

  public user$: Observable<any>
  public userBtnTooltip$: Observable<string>
  public favDataEntries$: Observable<Partial<IDataEntry>[]>

  public pluginTooltipText: string = `Plugins and Tools`
  public screenshotTooltipText: string = 'Take screenshot'
  public takingScreenshot: boolean = false

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

  public openTmplWithDialog(tmpl: TemplateRef<any>) {
    this.dialogRef && this.dialogRef.close()

    if (tmpl) { this.dialogRef = this.dialog.open(tmpl, {
      autoFocus: false,
      panelClass: ['col-12', 'col-sm-12', 'col-md-8', 'col-lg-6', 'col-xl-4'],
    })
    }
  }

  disableScreenshotTaking() {
    this.takingScreenshot = false
    this.changeDetectionRef.detectChanges()
  }

  private keyListenerConfigBase = {
    type: 'keydown',
    stop: true,
    prevent: true,
    target: 'document',
  }

  public keyListenerConfig = [{
    key: 'h',
    ...this.keyListenerConfigBase,
  }, {
    key: 'H',
    ...this.keyListenerConfigBase,
  }, {
    key: '?',
    ...this.keyListenerConfigBase,
  }]
}
