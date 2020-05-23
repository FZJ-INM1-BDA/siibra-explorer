import { Component } from "@angular/core";
import { Observable, interval } from "rxjs";
import { mapTo, startWith, scan } from "rxjs/operators";

@Component({
  selector: 'tryme-component',
  templateUrl: './tryme.template.html',
  styleUrls: [
    './tryme.style.css'
  ]
})

export class TryMeComponent{
  public interval$: Observable<any>

  constructor(){
    this.interval$ = interval(5000).pipe(
      mapTo(1),
      startWith(1),
      scan((acc, curr) => acc + curr)
    )
  }

  public texts = [
    'Try me!',
    'Touch enabled',
    'Drag around',
    'Zoom in / Zoom out'
  ]
}