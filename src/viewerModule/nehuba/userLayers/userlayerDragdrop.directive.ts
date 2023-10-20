import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
} from "@angular/core"
import { MatSnackBar } from "@angular/material/snack-bar"
import { Subscription } from "rxjs"
import { DragDropFileDirective } from "src/dragDropFile/dragDrop.directive"
import { UserLayerService } from "./service"
import { CONST } from "common/constants"

export const INVALID_FILE_INPUT = `Exactly one (1) file is required!`

@Directive({
  selector: "[sxplr-nehuba-drag-drop]",
})
export class UserLayerDragDropDirective
  extends DragDropFileDirective
  implements OnInit, OnDestroy
{
  public CONST = CONST
  #subscription: Subscription[] = []

  ngOnInit() {
    this.snackText = CONST.NEHUBA_DRAG_DROP_TEXT
    this.#subscription.push(
      this.dragDropOnDrop.subscribe((event) => {
        this.handleFileDrop(event)
      })
    )
  }
  ngOnDestroy() {
    super.ngOnDestroy()
    while (this.#subscription.length > 0) this.#subscription.pop().unsubscribe()
  }

  constructor(
    private snackbar: MatSnackBar,
    el: ElementRef,
    cdr: ChangeDetectorRef,
    private svc: UserLayerService
  ) {
    super(snackbar, el, cdr)
  }

  public async handleFileDrop(files: File[]): Promise<void> {
    if (files.length !== 1) {
      this.snackbar.open(INVALID_FILE_INPUT, "Dismiss", {
        duration: 5000,
      })
      return
    }
    const file = files[0]
    await this.svc.handleUserInput(file)
  }
}
