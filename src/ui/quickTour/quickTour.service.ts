import {ComponentRef, Inject, Injectable, OnDestroy} from "@angular/core";
import {BehaviorSubject, Subject, Subscription} from "rxjs";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { QuickTourThis } from "./quickTourThis.directive";
import { DoublyLinkedList, IDoublyLinkedItem } from 'src/util'
import { QUICK_TOUR_CMP_INJTKN } from "./constrants";
import {LOCAL_STORAGE_CONST} from "src/util/constants";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {StartTourDialogDialog} from "src/ui/quickTour/startTourDialog/startTourDialog.component";
import {take} from "rxjs/operators";

export function findInLinkedList<T extends object>(first: IDoublyLinkedItem<T>, predicate: (linkedObj: IDoublyLinkedItem<T>) => boolean): IDoublyLinkedItem<T>{
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
  private cmpRef: ComponentRef<any>

  public currSlideNum: number = null
  public currentTip$: BehaviorSubject<IDoublyLinkedItem<QuickTourThis>> = new BehaviorSubject(null)
  public detectChanges$: Subject<null> = new Subject()

  public currActiveSlide: IDoublyLinkedItem<QuickTourThis>
  public slides = new DoublyLinkedList<QuickTourThis>()

  private startTourDialogRef: MatDialogRef<any>

  constructor(
    private overlay: Overlay,
    /**
     * quickTourService cannot directly reference quickTourComponent
     * since quickTourComponent DI quickTourService
     * makes sense, since we want to keep the dependency of svc on cmp as loosely (or non existent) as possible
     */
    @Inject(QUICK_TOUR_CMP_INJTKN) private quickTourCmp: any,
    private matDialog: MatDialog
  ){
  }

  public register(dir: QuickTourThis) {
    this.slides.insertAfter(
      dir,
      linkedItem => {
        const nextItem = linkedItem.next
        if (nextItem && nextItem.thisObj.order < dir.order) {
          return false
        }
        return linkedItem.thisObj.order < dir.order
      }
    )
  }

  public unregister(dir: QuickTourThis){
    this.slides.remove(dir)
  }

  autoStart() {
    if (!localStorage.getItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED)) {
      this.startTourDialogRef = this.matDialog.open(StartTourDialogDialog)
      this.startTourDialogRef.afterClosed().pipe(take(1)).subscribe(res => {
        switch (res) {
        case 'start':
          this.startTour()
          localStorage.setItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED, 'true')
          break;
        case 'close':
          localStorage.setItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED, 'true')
          break;
        default:
          break;
        }
      })
    }
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
        new ComponentPortal(this.quickTourCmp)
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
