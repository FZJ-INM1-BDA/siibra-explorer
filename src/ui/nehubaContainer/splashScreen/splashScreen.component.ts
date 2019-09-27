import { Component, Pipe, PipeTransform, ElementRef, ViewChild, AfterViewInit } from "@angular/core";
import { Observable, fromEvent, Subscription, Subject } from "rxjs";
import { Store, select } from "@ngrx/store";
import { switchMap, bufferTime, take, filter, withLatestFrom, map, tap } from 'rxjs/operators'
import { ViewerStateInterface, NEWVIEWER } from "../../../services/stateStore.service";
import { AtlasViewerConstantsServices } from "../../../atlasViewer/atlasViewer.constantService.service";


@Component({
  selector : 'ui-splashscreen',
  templateUrl : './splashScreen.template.html',
  styleUrls : [
    `./splashScreen.style.css`
  ]
})

export class SplashScreen implements AfterViewInit{

  public loadedTemplate$ : Observable<any[]>
  @ViewChild('parentContainer', {read:ElementRef}) 
  private parentContainer: ElementRef
  private activatedTemplate$: Subject<any> = new Subject()

  private subscriptions: Subscription[] = []

  constructor(
    private store:Store<ViewerStateInterface>,
    private constanceService: AtlasViewerConstantsServices,
    private constantsService: AtlasViewerConstantsServices,
  ){
    this.loadedTemplate$ = this.store.pipe(
      select('viewerState'),
      select('fetchedTemplates')
    )
  }

  ngAfterViewInit(){

    /**
     * instead of blindly listening to click event, this event stream waits to see if user mouseup within 200ms
     * if yes, it is interpreted as a click
     * if no, user may want to select a text
     */
    this.subscriptions.push(
      fromEvent(this.parentContainer.nativeElement, 'mousedown').pipe(
        switchMap(() => fromEvent(this.parentContainer.nativeElement, 'mouseup').pipe(
          bufferTime(200),
          take(1)
        )),
        filter(arr => arr.length > 0),
        withLatestFrom(this.activatedTemplate$),
        map(([_, template]) => template)
      ).subscribe(template => this.selectTemplate(template))
    )
  }

  selectTemplateParcellation(template, parcellation){
    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : parcellation
    })
  }

  selectTemplate(template:any){
    this.store.dispatch({
      type : NEWVIEWER,
      selectTemplate : template,
      selectParcellation : template.parcellations[0]
    })
  }

  get totalTemplates(){
    return this.constanceService.templateUrls.length
  }
}

@Pipe({
  name: 'getTemplateImageSrcPipe'
})

export class GetTemplateImageSrcPipe implements PipeTransform{
  public transform(name:string):string{
    return `./res/image/${name.replace(/[|&;$%@()+,\s./]/g, '')}.png`
  }
}

@Pipe({
  name: 'imgSrcSetPipe'
})

export class ImgSrcSetPipe implements PipeTransform{
  public transform(src:string):string{
    const regex = /^(.*?)(\.\w*?)$/.exec(src)
    if (!regex) throw new Error(`cannot find filename, ext ${src}`)
    const filename = regex[1]
    const ext = regex[2]
    return [100, 200, 300, 400].map(val => `${filename}-${val}${ext} ${val}w`).join(',')
  }
} 