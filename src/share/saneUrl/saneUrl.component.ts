import { Component, OnDestroy, Input } from "@angular/core";
import { Observable, merge, of, Subscription, BehaviorSubject, combineLatest } from "rxjs";
import { startWith, mapTo, map, debounceTime, switchMap, catchError, shareReplay, filter, tap, takeUntil, distinctUntilChanged } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { Clipboard } from "@angular/cdk/clipboard";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SaneUrlSvc } from "./saneUrl.service";
import { NotFoundError } from "../type";

export class SaneUrlErrorStateMatcher implements ErrorStateMatcher{
  isErrorState(ctrl: FormControl | null){
    return !!(ctrl && ctrl.invalid)
  }
}

enum ESavingProgress {
  INIT,
  INPROGRESS,
  DONE,
  DEFAULT,
  ERROR,
}

enum EBtnTxt {
  AVAILABLE = 'Available',
  VERIFYING = 'Verifying ...',
  CREATING = 'Creating ...',
  CREATED = 'Created!',
  DEFAULT = '...',
}

enum ESavingStatus {
  PENDING,
  FREE,
  NOTFREE,
}

@Component({
  selector: 'iav-sane-url',
  templateUrl: './saneUrl.template.html'
})

export class SaneUrl implements OnDestroy{

  public saneUrlRoot = this.svc.saneUrlRoot

  @Input() stateTobeSaved: any

  private subscriptions: Subscription[] = []

  private validator = (val: string) => /^[a-zA-Z0-9_]+$/.test(val)
  public customUrl = new FormControl('')

  public matcher = new SaneUrlErrorStateMatcher()

  public createBtnDisabled$: Observable<boolean>
  public iconClass$: Observable<string>

  public savingStatus$: Observable<ESavingStatus>
  public btnHintTxt$: Observable<EBtnTxt>

  public savingProgress$: BehaviorSubject<ESavingProgress> = new BehaviorSubject(ESavingProgress.INIT)
  public saved$: Observable<boolean>

  constructor(
    private clipboard: Clipboard,
    private snackbar: MatSnackBar,
    private svc: SaneUrlSvc,
  ){

    const validatedValueInput$ = this.customUrl.valueChanges.pipe(
      tap(val => {
        if (!this.validator(val)) {
          this.customUrl.setErrors({
            message: 'Shortname must only use the following characters: a-zA-Z0-9_'
          })
        }
      }),
      filter(this.validator),
      distinctUntilChanged(),
      shareReplay(1),
    )

    const checkAvailable$ = validatedValueInput$.pipe(
      debounceTime(500),
      switchMap(val => val === ''
        ? of(false)
        : this.svc.getKeyVal(val).pipe(
          mapTo(false),
          catchError((err, obs) => {
            if (err instanceof NotFoundError) return of(true)
            return of(false)
          })
        )
      ),
      shareReplay(1)
    )

    this.savingStatus$ = merge(
      this.customUrl.valueChanges.pipe(
        mapTo(ESavingStatus.PENDING)
      ),
      checkAvailable$.pipe(
        map(available => available ? ESavingStatus.FREE : ESavingStatus.NOTFREE)
      )
    )

    this.btnHintTxt$ = combineLatest([
      this.savingStatus$,
      this.savingProgress$,
    ]).pipe(
      map(([savingStatus, savingProgress]) => {
        if (savingProgress === ESavingProgress.DONE) return EBtnTxt.CREATED
        if (savingProgress === ESavingProgress.INPROGRESS) return EBtnTxt.CREATING
        if (savingStatus === ESavingStatus.FREE) return EBtnTxt.AVAILABLE
        if (savingStatus === ESavingStatus.PENDING) return EBtnTxt.VERIFYING
        return EBtnTxt.DEFAULT
      })
    )
    
    this.createBtnDisabled$ = this.savingStatus$.pipe(
      map(val => val !== ESavingStatus.FREE),
      startWith(true)
    )

    this.iconClass$ = combineLatest([
      this.savingStatus$,
      this.savingProgress$,
    ]).pipe(
      map(([savingStatus, savingProgress]) => {
        if (savingProgress === ESavingProgress.DONE) return `fas fa-check`
        if (savingProgress === ESavingProgress.INPROGRESS) return `fas fa-spinner fa-spin`
        if (savingStatus === ESavingStatus.FREE) return `fas fa-link`
        if (savingStatus === ESavingStatus.PENDING) return `fas fa-spinner fa-spin`
        if (savingStatus === ESavingStatus.NOTFREE) return `fas fa-ban`
        return EBtnTxt.DEFAULT
      }),
      startWith('fas fa-ban'),
    )

    this.subscriptions.push(
      checkAvailable$.subscribe(flag => {
        if (!flag) this.customUrl.setErrors({ message: 'Shortname not available' })
      })
    )

    this.saved$ = this.savingProgress$.pipe(
      map(v => v === ESavingProgress.DONE),
      startWith(false),
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0){
      this.subscriptions.pop().unsubscribe()
    }
  }

  saveLink(){
    this.savingProgress$.next(ESavingProgress.INPROGRESS)
    this.customUrl.disable()
    this.svc.setKeyVal(
      this.customUrl.value,
      this.stateTobeSaved
    ).subscribe(
      resp => {
        this.savingProgress$.next(ESavingProgress.DONE)
      },
      err => {
        this.customUrl.enable()

        const { status, error, statusText } = err
        this.customUrl.setErrors({ message: `${status}: ${error || statusText}` })
        this.savingProgress$.next(ESavingProgress.INIT)
      },
    )
  }

  copyLinkToClipboard(){
    const success = this.clipboard.copy(`${this.saneUrlRoot}${this.customUrl.value}`)
    this.snackbar.open(
      success ? `Copied URL to clipboard!` : `Failed to copy URL to clipboard!`,
      null,
      { duration: 1000 }
    )
  }
}
