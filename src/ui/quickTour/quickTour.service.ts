import { ComponentRef, Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { QuickTourComponent } from "./quickTourComponent/quickTour.component";
import { QuickTourThis } from "./quickTourThis.directive";
import { DoublyLinkedList, IDoublyLinkedItem } from 'src/util'

export function findInLinkedList<T>(first: IDoublyLinkedItem<T>, predicate: (linkedObj: IDoublyLinkedItem<T>) => boolean): IDoublyLinkedItem<T>{
  let compareObj = first,
    returnObj: IDoublyLinkedItem<T> = null

  do {
    if (predicate(compareObj)) {
      returnObj = compareObj
      break
    }
    compareObj = compareObj.next
  } while(!!compareObj)

  return returnObj
}

@Injectable()
export class QuickTourService {

  private overlayRef: OverlayRef
  private cmpRef: ComponentRef<QuickTourComponent>

  public currSlideNum: number = null
  public currentTip$: BehaviorSubject<IDoublyLinkedItem<QuickTourThis>> = new BehaviorSubject(null)
  public detectChanges$: Subject<null> = new Subject()

  public currActiveSlide: IDoublyLinkedItem<QuickTourThis>
  public slides = new DoublyLinkedList<QuickTourThis>()

  constructor(
    private overlay: Overlay,
  ){

    // todo remove in production
    setTimeout(() => {
      this.startTour()
    }, 2500)
  }

  public register(dir: QuickTourThis) {
    
    this.slides.insertAfter(
      dir,
      tourObj => tourObj.order < dir.order
    )
  }

  public unregister(dir: QuickTourThis){
    this.slides.remove(dir)
  }

  public startTour() {
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        height: '0px',
        width: '0px',
        hasBackdrop: true,
        backdropClass: ['pe-none', 'cdk-overlay-dark-backdrop'],
        positionStrategy: this.overlay.position().global(),
      })  
    }
    
    if (!this.cmpRef) {
      this.cmpRef = this.overlayRef.attach(
        new ComponentPortal(QuickTourComponent)
      )
  
      this.currActiveSlide = this.slides.first
      this.currentTip$.next(this.currActiveSlide)
    }
  }

  public endTour() {
    if (this.overlayRef) {
      this.overlayRef.dispose()
      this.overlayRef = null
      this.cmpRef = null
    }
  }

  public nextSlide() {
    this.currActiveSlide = this.currActiveSlide.next
    this.currentTip$.next(this.currActiveSlide)
  }

  public previousSlide() {
    this.currActiveSlide = this.currActiveSlide.prev
    this.currentTip$.next(this.currActiveSlide)
  }

  changeDetected(dir: QuickTourThis) {
    if (this.currActiveSlide?.thisObj === dir) {
      this.detectChanges$.next(null)
    }
  }
}
