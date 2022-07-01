import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { Subject } from "rxjs";
import { map, startWith } from "rxjs/operators";

type TIVBColor = 'default' | 'primary' | 'accent' | 'warn'

@Component({
  selector: 'iav-v-button',
  templateUrl: './vButton.template.html',
  styleUrls: [
    './vButton.style.css'
  ],
  exportAs: 'iavVButton',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class IAVVerticalButton{

  private color$ = new Subject<TIVBColor>()
  public class$ = this.color$.pipe(
    startWith('default'),
    map(colorCls => `d-flex flex-column align-items-center sxplr-custom-cmp ${colorCls} h-100`)
  )

  @Input()
  set color(val: TIVBColor){
    this.color$.next(val)
  }
}