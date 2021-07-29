import { Component, ElementRef, Pipe, PipeTransform, ViewChild } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { select, Store } from "@ngrx/store";
import { Observable, Subject, Subscription } from "rxjs";
import { filter } from 'rxjs/operators'
import { viewerStateHelperStoreName, viewerStateSelectAtlas } from "src/services/state/viewerState.store.helper";
import { PureContantService } from "src/util";
import { CONST } from 'common/constants'

@Component({
  selector : 'ui-splashscreen',
  templateUrl : './splashScreen.template.html',
  styleUrls : [
    `./splashScreen.style.css`,
  ],
})

export class SplashScreen {

  public finishedLoading: boolean = false

  public loadedAtlases$: Observable<any[]>

  @ViewChild('parentContainer', {read: ElementRef})
  public activatedTemplate$: Subject<any> = new Subject()

  private subscriptions: Subscription[] = []

  constructor(
    private store: Store<any>,
    private snack: MatSnackBar,
    private pureConstantService: PureContantService
  ) {
    this.subscriptions.push(
      this.pureConstantService.allFetchingReady$.subscribe(flag => this.finishedLoading = flag)
    )

    this.loadedAtlases$ = this.store.pipe(
      select(state => state[viewerStateHelperStoreName]),
      select(state => state.fetchedAtlases),
      filter(v => !!v)
    )
  }

  public selectAtlas(atlas: any){
    if (!this.finishedLoading) {
      this.snack.open(CONST.DATA_NOT_READY, null, {
        duration: 3000
      })
      return
    }
    this.store.dispatch(
      viewerStateSelectAtlas({ atlas })
    )
  }
}

@Pipe({
  name: 'getTemplateImageSrcPipe',
})

export class GetTemplateImageSrcPipe implements PipeTransform {
  public transform(name: string): string {
    return `./res/image/${name.replace(/[|&;$%@()+,\s./]/g, '')}.png`
  }
}
