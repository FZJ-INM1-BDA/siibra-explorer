import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";

export enum SCALE_ORIGIN {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
  CENTER = 'center',
}

@Injectable()
export class FabSpeedDialService implements OnDestroy{
  public openState$ = new BehaviorSubject(false)
  public scaleOrigin$: BehaviorSubject<SCALE_ORIGIN> = new BehaviorSubject(SCALE_ORIGIN.CENTER)
  private s: Subscription[] = []

  public isOpen: boolean = false

  constructor(){
    this.s.push(
      this.openState$.subscribe(flag => this.isOpen = flag)
    )
  }

  ngOnDestroy(){
    while(this.s.length > 0) {
      this.s.pop().unsubscribe()
    }
  }

  toggle(){
    this.openState$.next(!this.isOpen)
  }

  close(){
    this.openState$.next(false)
  }

  open(){
    this.openState$.next(true)
  }
}