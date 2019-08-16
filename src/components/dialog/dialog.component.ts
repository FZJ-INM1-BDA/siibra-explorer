import { Component, Input, ChangeDetectionStrategy, ViewChild, ElementRef, OnInit, OnDestroy, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { Subscription, Observable, fromEvent } from "rxjs";
import { filter, share } from "rxjs/operators";

@Component({
  selector: 'dialog-component',
  templateUrl: './dialog.template.html',
  styleUrls: [
    './dialog.style.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DialogComponent implements OnInit, OnDestroy {

  private subscrptions: Subscription[] = []
  
  @Input() title: string = 'Message'
  @Input() placeholder: string = "Type your response here"
  @Input() defaultValue: string = ''
  @Input() message: string = ''
  @ViewChild('inputField', {read: ElementRef}) private inputField: ElementRef

  private value: string = ''
  private keyListener$: Observable<any>

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private dialogRef: MatDialogRef<DialogComponent>
  ){
    const { title, placeholder, defaultValue, message } = this.data
    if (title) this.title = title
    if (placeholder) this.placeholder = placeholder
    if (defaultValue) this.value = defaultValue
    if (message) this.message = message
  }

  ngOnInit(){

    this.keyListener$ = fromEvent(this.inputField.nativeElement, 'keyup').pipe(
      filter((ev: KeyboardEvent) => ev.key === 'Enter' || ev.key === 'Esc' || ev.key === 'Escape'),
      share()
    )
    this.subscrptions.push(
      this.keyListener$.subscribe(ev => {
        if (ev.key === 'Enter') {
          this.dialogRef.close(this.value)
        }
        if (ev.key === 'Esc' || ev.key === 'Escape') {
          this.dialogRef.close(null)
        }
      })
    )
  }

  confirm(){
    this.dialogRef.close(this.value)
  }

  cancel(){
    this.dialogRef.close(null)
  }

  ngOnDestroy(){
    while(this.subscrptions.length > 0) {
      this.subscrptions.pop().unsubscribe()
    }
  }
}