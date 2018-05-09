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

        /* escape the backslashes in filename */
        const idx = this.findRealIndex(curr.filename)
        
        const dirname = curr.filename.slice(0,idx)
        return acc.findIndex(obj=>obj.title == this.getRealName(dirname)) >= 0 ?
          acc
            .map(obj=>{
              return obj.title == this.getRealName(dirname) ?
                Object.assign({},obj,{files:obj.files.concat(this.sliceName(curr))}) : 
                obj
            }) :
          acc.concat({
            title : this.getRealName(dirname),
            files : [this.sliceName(curr)]
          })
      },[] as {title:string,files:SearchResultFileInterface[]}[])
  }

  private sliceName(file:SearchResultFileInterface):SearchResultFileInterface{
    return Object.assign({},file,
      {
        filename:file.filename.slice(this.findRealIndex(file.filename)+1)
      })
  }

  private findRealIndex(filename:string):number{

    let idx = filename.indexOf('/')
    while(filename[idx-1] === '\\' && idx >= 0){
      idx = filename.indexOf('/',idx + 1)
    }
    return idx
  }

  private getRealName(filename:string):string{
    return filename.replace(/\\\//g,'/')
  }
}