import { Component, Input, OnChanges/* , ChangeDetectionStrategy */, Pipe, PipeTransform, TemplateRef, OnDestroy, ViewChildren } from '@angular/core'
import { WidgitServices, MasterCollapsableController } from 'nehubaUI/nehubaUI.services'
import { Subject,Observable } from 'rxjs/Rx';

import template from './searchResultUIFileFolders.template.html'
import css from './searchResultUIFileFolders.style.css'
import { SearchResultFileInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';
import { CollapsablePanel } from 'nehubaUI/components/collapsablePanel/nehubaUI.collapsablePanel.component';

@Component({
  selector : `nehubaui-searchresult-filesfolder-ui`,
  template ,
  styles : [
    css
  ]/* ,
  changeDetection : ChangeDetectionStrategy.OnPush */
})

export class SearchResultUIFileFolders implements OnChanges,OnDestroy{
  @Input() inputFiles : SearchResultFileInterface[] = []
  @ViewChildren(CollapsablePanel) collapsablePanels : CollapsablePanel[] = []

  destroySubject : Subject<boolean> = new Subject()
  
  constructor(private widgetService:WidgitServices,private collapseableController:MasterCollapsableController){

    Observable
      .from(this.collapseableController.expandBSubject)
      .takeUntil(this.destroySubject)
      .subscribe(bool=>{
        this.collapsablePanels.forEach(cp=>bool ? cp.show() : cp.hide())
      })
  }

  ngOnDestroy(){
    this.destroySubject.next(true)
  }

  ngOnChanges(){
    
  }

  popupFileViewer(file:SearchResultFileInterface,templateref:TemplateRef<any>){
    const widgetComponent = this.widgetService.widgitiseTemplateRef(templateref,{name:`default.default.${file.name}`,onShutdownCleanup:()=>widgetComponent.parentViewRef.destroy()})
    widgetComponent.changeState('floating')
  }
}

@Pipe({
  name : 'searchResultFilesFolderZeroHeirachyPipe'
})

export class SearchResultFilesFolderZeroHeirachyPipe implements PipeTransform{
  public transform(files:SearchResultFileInterface[]):SearchResultFileInterface[]{
    return files.filter(f=>f.filename.indexOf('/')<=0)
  }
}

@Pipe({
  name : 'searchResultFilesfolderHierachyPipe'
})

export class SearchResultFilesFolderHeirachyPipe implements PipeTransform{
  public transform(files:SearchResultFileInterface[]):{title:string,files:SearchResultFileInterface[]}[]{
    return files
      .filter(f=>f.filename.indexOf('/')>0)
      .reduce((acc,curr)=>{
        const idx = curr.filename.indexOf('/')
        const dirname = curr.filename.slice(0,idx)
        return acc.findIndex(obj=>obj.title == dirname) >= 0 ?
          acc
            .map(obj=>{
              return obj.title == dirname ?
                Object.assign({},obj,{files:obj.files.concat(this.sliceName(curr))}) : 
                obj
            }) :
          acc.concat({
            title : dirname,
            files : [this.sliceName(curr)]
          })
      },[] as {title:string,files:SearchResultFileInterface[]}[])
  }

  private sliceName(file:SearchResultFileInterface):SearchResultFileInterface{
    return Object.assign({},file,{filename:file.filename.slice(file.filename.indexOf('/')+1)})
  }
}