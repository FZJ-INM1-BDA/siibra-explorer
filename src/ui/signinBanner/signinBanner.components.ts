import {Component, ChangeDetectionStrategy, Input, TemplateRef } from "@angular/core";
import { AuthService, User } from "src/services/auth.service";
import { MatDialog, MatDialogRef, MatBottomSheet } from "@angular/material";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DataEntry, IavRootStoreInterface } from "src/services/stateStore.service";
import { Store, select } from "@ngrx/store";


@Component({
  selector: 'signin-banner',
  templateUrl: './signinBanner.template.html',
  styleUrls: [
    './signinBanner.style.css',
    '../btnShadow.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SigninBanner{

  @Input() darktheme: boolean
  @Input() parcellationIsSelected: boolean

  public user$: Observable<User>
  public userBtnTooltip$: Observable<string>
  public favDataEntries$: Observable<DataEntry[]>

  public pluginTooltipText: string = `Plugins and Tools`
  public screenshotTooltipText: string = 'Take screenshot'

  constructor(
    private store$: Store<IavRootStoreInterface>,
    private authService: AuthService,
    private dialog: MatDialog,
    public bottomSheet: MatBottomSheet
  ){
    this.user$ = this.authService.user$

    this.userBtnTooltip$ = this.user$.pipe(
      map(user => user
        ? `Logged in as ${(user && user.name) ? user.name : 'Unknown name'}`
        : `Not logged in`)
    )

    this.favDataEntries$ = this.store$.pipe(
      select('dataStore'),
      select('favDataEntries')
    )
  }

  private dialogRef: MatDialogRef<any>

  openTmplWithDialog(tmpl: TemplateRef<any>){
    this.dialogRef && this.dialogRef.close()

    if (tmpl) this.dialogRef = this.dialog.open(tmpl, {
      autoFocus: false,
      panelClass: ['col-12','col-sm-12','col-md-8','col-lg-6','col-xl-4']
    })
  }

  private keyListenerConfigBase = {
    type: 'keydown',
    stop: true,
    prevent: true,
    target: 'document'
  }

  public keyListenerConfig = [{
    key: 'h',
    ...this.keyListenerConfigBase
  },{
    key: 'H',
    ...this.keyListenerConfigBase
  },{
    key: '?',
    ...this.keyListenerConfigBase
  }]
}