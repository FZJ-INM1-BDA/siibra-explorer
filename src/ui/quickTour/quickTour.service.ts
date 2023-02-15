import { ComponentRef, Inject, Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { QuickTourThis } from "./quickTourThis.directive";
import { DoublyLinkedList, IDoublyLinkedItem } from 'src/util'
import { EnumQuickTourSeverity, PERMISSION_DIALOG_ACTIONS, QuickTourSeverity, QUICK_TOUR_CMP_INJTKN } from "./constrants";
import { LOCAL_STORAGE_CONST } from "src/util/constants";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { StartTourDialogDialog } from "src/ui/quickTour/startTourDialog/startTourDialog.component";

const autoPlayPriority: Set<EnumQuickTourSeverity | keyof typeof QuickTourSeverity> = new Set([
  EnumQuickTourSeverity.HIGH,
  EnumQuickTourSeverity.MEDIUM,
  "medium",
  "high"
])

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

  public autoStartTriggered = false

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

    
    if (autoPlayPriority.has(dir.quickTourSeverity)) {
      this.autoStart()
    }
  }

  public unregister(dir: QuickTourThis){
    this.slides.remove(dir)
  }

  autoStart() {

    // if already viewed quick tour, return
    if (localStorage.getItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED)){
      return
    }
    // if auto start already triggered, return
    if (this.autoStartTriggered) return
    this.autoStartTriggered = true
    this.startTourDialogRef = this.matDialog.open(StartTourDialogDialog)
    this.startTourDialogRef.afterClosed().subscribe(res => {
      switch (res) {
      case PERMISSION_DIALOG_ACTIONS.START:
        this.startTour()
        localStorage.setItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED, 'true')
        break
      case PERMISSION_DIALOG_ACTIONS.CANCEL:
        localStorage.setItem(LOCAL_STORAGE_CONST.QUICK_TOUR_VIEWED, 'true')
        break
      }
    })

  }

  public startTour() {
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        height: '0px',
        width: '0px',
        hasBackdrop: true,
        backdropClass: ['sxplr-pe-none', 'cdk-overlay-dark-backdrop'],
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
    if (!this.currActiveSlide.next) return
    this.currActiveSlide = this.currActiveSlide.next
    this.currentTip$.next(this.currActiveSlide)
  }

  public previousSlide() {
    if (!this.currActiveSlide.prev) return
    this.currActiveSlide = this.currActiveSlide.prev
    this.currentTip$.next(this.currActiveSlide)
  }

  public ff(index: number) {
    try {
      const slide = this.slides.get(index)
      this.currActiveSlide = slide
      this.currentTip$.next(slide)
    } catch (_e) {
      console.warn(`cannot find slide with index ${index}`)
    }
  }

  changeDetected(dir: QuickTourThis) {
    if (this.currActiveSlide?.thisObj === dir) {
      this.detectChanges$.next(null)
    }
  }
}
