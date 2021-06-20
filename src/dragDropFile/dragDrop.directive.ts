import { Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { fromEvent, merge, Observable, of, Subscription } from "rxjs";
import { debounceTime, map, scan, switchMap } from "rxjs/operators";
import {MatSnackBar, MatSnackBarRef, SimpleSnackBar} from "@angular/material/snack-bar";

@Directive({
  selector: '[drag-drop-file]',
  exportAs: 'dragDropFile'
})

export class DragDropFileDirective implements OnInit, OnDestroy {

  @Input()
  public snackText: string

  @Output('drag-drop-file')
  public dragDropOnDrop: EventEmitter<File[]> = new EventEmitter()

  @HostBinding('style.transition')
  public transition = `opacity 300ms ease-in`

  @HostBinding('style.opacity')
  public opacity = null

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

    this.dragDropOnDrop.emit(Array.from(ev.dataTransfer.files))
  }

  public reset() {
    if (this.snackbarRef) {
      this.snackbarRef.dismiss()
    }
    this.opacity = null
  }

  private subscriptions: Subscription[] = []

  public ngOnInit() {
    this.subscriptions.push(
      this.dragover$.pipe(
        debounceTime(16),
      ).subscribe(flag => {
        if (flag) {
          this.snackbarRef = this.snackBar.open(this.snackText || `Drop file(s) here.`)
          this.opacity = 0.2
        } else {
          this.reset()
        }
      }),
    )
  }

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  constructor(private snackBar: MatSnackBar, private el: ElementRef) {
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
  }
}
