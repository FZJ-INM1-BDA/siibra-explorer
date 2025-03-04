import { Component, Inject, Optional, TemplateRef } from '@angular/core';
import { Clipboard, MatDialog, MatDialogRef, MatSnackBar } from 'src/sharedModules/angularMaterial.exports';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { Store } from '@ngrx/store';
import { atlasSelection } from 'src/state';
import { PointAssignmentDirective } from '../point-assignment.directive';
import { CLICK_INTERCEPTOR_INJECTOR, ClickInterceptor, HOVER_INTERCEPTOR_INJECTOR, HoverInterceptor } from 'src/util/injectionTokens';


@Component({
  selector: 'sxplr-point-assignment',
  templateUrl: './point-assignment.component.html',
  styleUrls: ['./point-assignment.component.scss']
})
export class PointAssignmentComponent extends PointAssignmentDirective {

  constructor(sapi: SAPI, private dialog: MatDialog,
    private store: Store,
    private clipboard: Clipboard,
    private snackbar: MatSnackBar,
    @Optional() @Inject(HOVER_INTERCEPTOR_INJECTOR) 
    hoverInterceptor: HoverInterceptor,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR)
    clickInterceptor: ClickInterceptor,
  ) {
    super(sapi, hoverInterceptor, clickInterceptor)
  }

  #dialogRef: MatDialogRef<unknown>
  openDialog(tmpl: TemplateRef<unknown>){
    this.#dialogRef = this.dialog.open(tmpl)
    this.#dialogRef.afterClosed().subscribe(() => {
      this.#dialogRef = null
    })
  }

  navigateToPoint(coordsInMm: number[]){
    this.store.dispatch(
      atlasSelection.actions.navigateTo({
        animation: true,
        navigation: {
          position: coordsInMm.map(v => v * 1e6)
        }
      })
    )
  }
  
  copyCoord(coord: number[]){
    const strToCopy = coord.map(v => `${v.toFixed(2)}mm`).join(', ')
    this.clipboard.copy(strToCopy)
    this.snackbar.open(`Copied to clipboard`, 'Dismiss', {
      duration: 4000
    })
  }

  selectRegion(regionName: string, event: MouseEvent){
    super.selectRegion(regionName, event)
    if (this.#dialogRef) {
      this.#dialogRef.close()
    }
  }
}
