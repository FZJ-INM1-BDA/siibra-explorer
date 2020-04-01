import { ChangeDetectionStrategy, Component, ElementRef, Inject, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { fromEvent, Observable, Subscription } from "rxjs";
import { filter, share } from "rxjs/operators";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'dialog-component',
  templateUrl: './dialog.template.html',
  styleUrls: [
    './dialog.style.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DialogComponent implements OnInit, OnDestroy {

  private subscrptions: Subscription[] = []

  @Input() public iconClass: string = `fas fa-save`

  @Input() public title: string = 'Message'
  @Input() public placeholder: string = "Type your response here"
  @Input() public defaultValue: string = ''
  @Input() public message: string = ''
  @ViewChild('inputField', {read: ElementRef}) private inputField: ElementRef

  public value: string = ''
  private keyListener$: Observable<any>

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DialogComponent>,
  ) {
    const { title, placeholder, defaultValue, message, iconClass = null } = this.data
    if (title) { this.title = title }
    if (placeholder) { this.placeholder = placeholder }
    if (defaultValue) { this.value = defaultValue }
    if (message) { this.message = message }
    if (typeof iconClass !== 'undefined') { this.iconClass = iconClass }
  }

  public ngOnInit() {

    this.keyListener$ = fromEvent(this.inputField.nativeElement, 'keyup').pipe(
      filter((ev: KeyboardEvent) => ev.key === 'Enter' || ev.key === 'Esc' || ev.key === 'Escape'),
      share(),
    )
    this.subscrptions.push(
      this.keyListener$.subscribe(ev => {
        if (ev.key === 'Enter') {
          this.dialogRef.close(this.value)
        }
        if (ev.key === 'Esc' || ev.key === 'Escape') {
          this.dialogRef.close(null)
        }
      }),
    )
  }

  public confirm() {
    this.dialogRef.close(this.value)
  }

  public cancel() {
    this.dialogRef.close(null)
  }

  public ngOnDestroy() {
    while (this.subscrptions.length > 0) {
      this.subscrptions.pop().unsubscribe()
    }
  }
}
