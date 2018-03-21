
import { Component,ChangeDetectorRef, ViewChild, ViewContainerRef, TemplateRef } from '@angular/core'
import { BsModalService,BsModalRef } from 'ngx-bootstrap/modal'
import { UI_CONTROL, ModalServices } from './nehubaUI.services'

import { Subscription } from 'rxjs/Rx'
import 'rxjs/observable/of'
import 'rxjs/operator/map'

@Component({
  selector: 'nehubaModal',
  template : ``
})

export class NehubaModalService{
  bsModalRef:BsModalRef

  constructor(private bsModalService:BsModalService,private modalServices:ModalServices){
    /**
     * input
     * info
     * curtain
     */
    this.modalServices.getModalHandler = this.getModalHandler
    UI_CONTROL.modalControl = this
  }

  public getModalHandler = ()=> new ModalHandler(this.bsModalService)
  
}

export class ModalHandler{
  public title : String | null = ''
  public body : Object | Array<any> | String | null = ''
  public footer : String | null = ''
  public config : any | null 

  bsModalRef : BsModalRef
  private subscriptions : Subscription[] = []

  /* TODO check if listeners can be heard globally */

  /**
   * Dynamically hide the modal.
   */
  public hide = ()=>{
    this.bsModalRef.hide()
  }

  public showTemplateRef = (template:TemplateRef<any>) => {
    this.show()
    this.bsModalRef.content.modalBody.createEmbeddedView(template)
  }
  
  /**
   * Show the modal with the assigned config.
   */
  public show = ()=>{
    this.bsModalRef = this.bsModalService.show( NehubaModalUnit,this.config )
    this.bsModalRef.content.title = this.title
    this.bsModalRef.content.body = this.body
    this.bsModalRef.content.footer = this.footer
    
    this.subscriptions.push( this.bsModalService.onHidden.subscribe(()=>
      this.subscriptions.forEach(subscription=>subscription.unsubscribe())
    ))
  }
  public onHide = (cb:(reason:any)=>void) =>
    this.subscriptions.push( this.bsModalService.onHide.subscribe((reason:String)=>cb(reason)) )
  public onHidden = (cb:(reason:any)=>void) =>
    this.subscriptions.push( this.bsModalService.onHidden.subscribe((reason:String)=>cb(reason)) )
  
  public onShow = (cb:(reason:any)=>void) =>
    this.subscriptions.push( this.bsModalService.onShow.subscribe((reason:String)=>cb(reason)) )
  public onShown = (cb:(reason:any)=>void) =>
    this.subscriptions.push( this.bsModalService.onShown.subscribe((reason:String)=>cb(reason)) )
  
  constructor(private bsModalService:BsModalService){
    
  }
}

@Component({
  selector : 'modal-unit',
  template:
    `
    <div (contextmenu) = "$event.stopPropagation()">
      <div *ngIf = "title" class = "modal-header" [innerHTML] = "title">
      </div>
      <div class = "modal-body" #modalBody>
        
        <div *ngIf = "body && body.constructor.name == 'String'" [innerHTML] = "body">
        </div>
        <tabset *ngIf = "body && body.constructor.name == 'Object'" class = "row">
          <tab *ngFor = "let key of body | keyPipe" [heading] = "key">
            <div class = "row">
              <multiform [data] = "body[key] | filterUncertainObject">
              </multiform>
            </div>
          </tab>
        </tabset>
        <multiform *ngIf = "body && body.constructor.name == 'Array'" class = "row" [data] = "body | filterUncertainObject">
        </multiform>
      </div>
      <div *ngIf = "footer" class = "modal-footer" [innerHTML] = "footer">
      </div>
    </div>
    `,
  styles : [
    `
    div.modal-body
    {
      padding:0px;
    }
    `
  ]
})

export class NehubaModalUnit{
  public title : String | null  = 'Default Title'
  public body : Object | Array<any> |String | null = 'Default body'
  public footer : String | null = 'default footer'
  @ViewChild('modalBody',{read:ViewContainerRef}) modalBody : ViewContainerRef

  constructor(private cd:ChangeDetectorRef){
    /* filterUncertainObject jsonStringifyPipe */
  }

  public updateModel = () => this.cd.detectChanges()
}