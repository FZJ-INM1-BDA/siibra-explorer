import { Directive } from "@angular/core";

@Directive({
  selector: '[iav-counter]',
  exportAs: 'iavCounter'
})

export class CounterDirective{
  public value: number = 0
}