import { Injectable } from "@angular/core";
import { SxplrSnackBarCfg, SxplrSnackDialogCmp } from "./snackDialog.component";
import { Subject } from "rxjs";
import { scan, shareReplay } from "rxjs/operators";
import { MatSnackBar } from "src/sharedModules";

@Injectable()
export class SxplrSnackBarSvc {

  #instanceData$: Subject<SxplrSnackBarCfg> = null
  open(data: SxplrSnackBarCfg){
    if (!this.#instanceData$) {
      this.#instanceData$ = new Subject()
      
      const obs = this.#instanceData$.pipe(
        scan((acc, curr) => acc.concat(curr), []),
        shareReplay(1),
      )

      // keep the observable hot
      // otherwise, we might lose data
      obs.subscribe()
      
      const cmp = this.snackbar.openFromComponent(SxplrSnackDialogCmp, {
        data: {
          cfgs$: obs
        }
      })
      
      cmp.afterDismissed().subscribe(() => {
        if (this.#instanceData$) {
          this.#instanceData$.complete()
          this.#instanceData$ = null
        }
      })
    }

    this.#instanceData$.next(data)

  }

  constructor(private snackbar: MatSnackBar){

  }
}
