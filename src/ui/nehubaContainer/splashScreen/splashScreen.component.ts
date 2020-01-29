import { AfterViewInit, Component, ElementRef, Pipe, PipeTransform, ViewChild } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { fromEvent, Observable, Subject, Subscription } from "rxjs";
import { bufferTime, filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators'
import { AtlasViewerConstantsServices } from "src/atlasViewer/atlasViewer.constantService.service";
import { NEWVIEWER, ViewerStateInterface } from "src/services/stateStore.service";

@Component({
  selector : 'ui-splashscreen',
  templateUrl : './splashScreen.template.html',
  styleUrls : [
    `./splashScreen.style.css`,
  ],
})

export class SplashScreen implements AfterViewInit {

  public loadedTemplate$: Observable<any[]>
  @ViewChild('parentContainer', {read: ElementRef})
  private parentContainer: ElementRef
  private activatedTemplate$: Subject<any> = new Subject()

  private subscriptions: Subscription[] = []

  constructor(
    private store: Store<ViewerStateInterface>,
    private constanceService: AtlasViewerConstantsServices,
    private constantsService: AtlasViewerConstantsServices,
  ) {
    this.loadedTemplate$ = this.store.pipe(
      select('viewerState'),
      select('fetchedTemplates'),
    )
  }

  public ngAfterViewInit() {

    /**
     * instead of blindly listening to click event, this event stream waits to see if user mouseup within 200ms
     * if yes, it is interpreted as a click
     * if no, user may want to select a text
     */
    this.subscriptions.push(
      fromEvent(this.parentContainer.nativeElement, 'mousedown').pipe(
        switchMap(() => fromEvent(this.parentContainer.nativeElement, 'mouseup').pipe(
          bufferTime(200),
          take(1),
        )),
        filter(arr => arr.length > 0),
        withLatestFrom(this.activatedTemplate$),
        map(([_, template]) => template),
      ).subscribe(template => this.selectTemplate(template)),
    )
  }

  public selectTemplateParcellation(template, parcellation) {
    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : parcellation,
    })
  }

  public selectTemplate(template: any) {
    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : template.parcellations[0],
    })
  }

  get totalTemplates() {
    return this.constanceService.templateUrls.length
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

@Pipe({
  name: 'imgSrcSetPipe',
})

export class ImgSrcSetPipe implements PipeTransform {
  public transform(src: string): string {
    const regex = /^(.*?)(\.\w*?)$/.exec(src)
    if (!regex) { throw new Error(`cannot find filename, ext ${src}`) }
    const filename = regex[1]
    const ext = regex[2]
    return [100, 200, 300, 400].map(val => `${filename}-${val}${ext} ${val}w`).join(',')
  }
}
