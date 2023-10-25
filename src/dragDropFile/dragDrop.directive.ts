import { ChangeDetectorRef, Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnDestroy, Output } from "@angular/core";
import { fromEvent, merge, Observable, of, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged, map, scan, switchMap } from "rxjs/operators";
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from "src/sharedModules/angularMaterial.exports"

@Directive({
  selector: '[drag-drop-file]',
  exportAs: 'dragDropFile'
})

export class DragDropFileDirective implements OnDestroy {

  @Input()
  public snackText: string

  @Output('drag-drop-file')
  public dragDropOnDrop: EventEmitter<File[]> = new EventEmitter()

  @HostBinding('style.transition')
  public transition = `opacity 300ms ease-in`

  @HostBinding('style.opacity')
  public hostOpacity = null

  get opacity() {
    return this.hostOpacity
  }
  set opacity(val: number) {
    this.hostOpacity = val
    this.cdr.markForCheck()
  }

  public snackbarRef: MatSnackBarRef<SimpleSnackBar>

  private dragover$: Observable<boolean>

  @HostListener('dragover', ['$event'])
  public ondragover(ev: DragEvent) {
    ev.preventDefault()
  }

  @HostListener('drop', ['$event'])
  public ondrop(ev: DragEvent) {
    ev.preventDefault()
    this.reset()

    this.dragDropOnDrop.emit(Array.from(ev?.dataTransfer?.files || []))
  }

  public reset() {
    if (this.snackbarRef) {
      this.snackbarRef.dismiss()
    }
    this.snackbarRef = null
    this.opacity = null
  }

  private subscriptions: Subscription[] = []

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  constructor(private snackBar: MatSnackBar, private el: ElementRef, private cdr: ChangeDetectorRef) {
    this.dragover$ = merge(
      of(null),
      fromEvent(this.el.nativeElement, 'drop'),
    ).pipe(
      switchMap(() => merge(
        fromEvent(this.el.nativeElement, 'dragenter').pipe(
          map(() => 1),
        ),
        fromEvent(this.el.nativeElement, 'dragleave').pipe(
          map(() => -1),
        ),
      ).pipe(
        scan((acc, curr) => acc + curr, 0),
        map(val => val > 0),
      )),
    )

    this.subscriptions.push(
      this.dragover$.pipe(
        debounceTime(16),
        distinctUntilChanged(),
      ).subscribe(flag => {
        if (flag) {
          this.snackbarRef = this.snackBar.open(
            this.snackText || `Drop file(s) here.`, 'Dismiss',
            {
              panelClass: 'sxplr-pe-none'
            }
          )

          /**
           * In buggy scenarios, user could at least dismiss by action
           */
          this.snackbarRef.afterDismissed().subscribe(reason => {
            if (reason.dismissedByAction) {
              this.reset()
            }
          })
          this.opacity = 0.2
        } else {
          this.reset()
        }
      }),
    )
  }
}
