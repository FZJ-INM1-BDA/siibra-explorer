import { Component, Input, OnDestroy, AfterViewInit } from '@angular/core'
import { MainController } from 'nehubaUI/nehubaUI.services';
import { Observable, Subject } from 'rxjs/Rx'

@Component({
  selector : 'dedicated-view-controller',
  styles : [
    `
    .well
    {
      width:calc(100% - 2em);
      box-sizing:border-box;
      margin:1em;
      overflow-x:auto;
    }
    .obstructedText
    {
      display:inline-block;
      margin:0 1em;
      width : calc(100% - 2em);
    }
    `
  ],
  template : 
  `
  <span *ngIf = "!isShowing" >

    <span 
      *ngIf = "isObstructed">

      <span class = "obstructedText">
        The viewer is currently displaying another dataset:
      </span>
      
      <div class = "well">
        {{ nowShowing }}
      </div>
      <span class = "obstructedText">
        This dataset can be displayed after the currently shown dataset is cleared.
      </span>
      <span (click)="removeDedicatedView()" class = "btn btn-link">
        clear the currently shown dataset
      </span>
    </span>

    <span
      (click) = "showDedicatedView()"
      class = "btn btn-link"
      *ngIf = "!isObstructed">

      show this dataset in the viewer
    </span>

  </span>

  <span 
    (click) = "removeDedicatedView()"
    *ngIf = "isShowing"
    class = "btn btn-link">

    clear this dataset from the viewer
  </span>
  `
})

export class DedicatedViewController implements AfterViewInit,OnDestroy{
  @Input() dedicatedViewString : string = ``
  @Input() dedicatedViewNehubaLayerObject : any /* nehubaLayerObject */

  isShowing : boolean = false
  isObstructed : boolean = false
  destroySubject : Subject<boolean> = new Subject()
  
  constructor(public mainController:MainController){
    
  }

  ngAfterViewInit(){
    Observable
      .from(this.mainController.dedicatedViewBSubject)
      .takeUntil(this.destroySubject)
      .subscribe(dedicatedView=>{
        this.isShowing = dedicatedView ? dedicatedView.url === this.dedicatedViewString : false
        this.isObstructed = dedicatedView !== null && dedicatedView.url != this.dedicatedViewString
      })
  }

  ngOnDestroy(){
    this.destroySubject.next(true)
  }

  showDedicatedView(){
    this.mainController.dedicatedViewBSubject.next(
      this.dedicatedViewNehubaLayerObject ? 
        Object.assign({},{url:this.dedicatedViewString,data:this.dedicatedViewNehubaLayerObject}) :
        Object.assign({},{url:this.dedicatedViewString})
    )
  }

  removeDedicatedView(){
    this.mainController.dedicatedViewBSubject.next(null)
  }
  
  get nowShowing():string|null{
    const dedicated = this.mainController.dedicatedViewBSubject.getValue()
    return dedicated ? 
      dedicated.url.split('/')[dedicated.url.split('/').length-1]:
      null
  }
}