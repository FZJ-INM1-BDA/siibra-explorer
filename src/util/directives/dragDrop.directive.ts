import { Directive, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy, HostBinding } from "@angular/core";
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from "@angular/material";
import { Observable, fromEvent, merge, Subscription, of, from } from "rxjs";
import { map, scan, distinctUntilChanged, debounceTime, tap, switchMap, takeUntil } from "rxjs/operators";

@Directive({
  selector: '[drag-drop]'
})

export class DragDropDirective implements OnInit, OnDestroy{

  @Input()
  snackText: string

  @Output('drag-drop')
  dragDropOnDrop: EventEmitter<File[]> = new EventEmitter()

  @HostBinding('style.transition')
  transition = `opacity 300ms ease-in`

  @HostBinding('style.opacity')
  opacity = null

  public snackbarRef: MatSnackBarRef<SimpleSnackBar>

  private dragover$: Observable<boolean>

  @HostListener('dragover', ['$event'])
  ondragover(ev:DragEvent){
    ev.preventDefault()
  }

  @HostListener('drop', ['$event'])
  ondrop(ev:DragEvent) {
    ev.preventDefault()
    this.reset()

    this.dragDropOnDrop.emit(Array.from(ev.dataTransfer.files))
  }

  reset(){
    if (this.snackbarRef) {
      this.snackbarRef.dismiss()
    }
    this.opacity = null
  }

  private subscriptions: Subscription[] = []

  ngOnInit(){
    this.subscriptions.push(
      this.dragover$.pipe(
        debounceTime(16)
      ).subscribe(flag => {
        if (flag) {
          this.snackbarRef = this.snackBar.open(this.snackText || `Drop file(s) here.`)
          this.opacity = 0.2
        } else {
          this.reset()
        }
      })
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  constructor(private snackBar: MatSnackBar, private el:ElementRef){
    this.dragover$ = merge(
      of(null),
      fromEvent(this.el.nativeElement, 'drop')
    ).pipe(
      switchMap(() => merge(
        fromEvent(this.el.nativeElement, 'dragenter').pipe(
          map(() => 1)
        ),
        fromEvent(this.el.nativeElement, 'dragleave').pipe(
          map(() => -1)
        )
      ).pipe(
        scan((acc, curr) => acc + curr, 0),
        map(val => val > 0)
      ))
    )
  }
}