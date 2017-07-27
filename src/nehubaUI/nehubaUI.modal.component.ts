
import { Component,ViewChild,Output,EventEmitter } from '@angular/core'
import { ModalDirective } from 'ngx-bootstrap/modal'

@Component({
    selector: 'nehubaModal',
    template : `
<div bsModal #inputModal="bs-modal" class = "modal fade" tabindex = -1 role = "dialog">
    <div class = "modal-dialog modal-lg">
        <div class = "modal-content">
            <div class = "modal-header">
                <h4 class = "modal-title pull-left">{{inputLabel}}</h4>
                <button type="button" class="close pull-right" (click)="inputModal.hide()" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class = "modal-body">
                <div class = "row">
                    <div class = "form-group">
                        <div class = "col-md-2">
                            <label>
                                {{inputLabel}}
                            </label>
                        </div>
                        <div class = "col-md-8">
                            <input [(ngModel)] = "inputInput" class = "form-control">
                        </div>
                        <div class = "col-md-2">
                            <div (click)="callFetchTemplate(inputInput)" class = "btn btn-block btn-primary">GET</div>
                        </div>
                    </div>
                </div>
                <div *ngIf = "inputResponse != ''">
                    <hr>
                    <div class = "row">
                        <div class = "col-md-12">
                            <pre>
                                {{inputResponse}}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div bsModal #infoModal="bs-modal" class = "modal fade" tabindex = -1 role = "dialog">
    <div class = "modal-dialog modal-lg">
        <div class = "modal-content">
            <div class = "modal-header">
                <h4 class = "modal-title pull-left">{{title}}</h4>
                <button type="button" class="close pull-right" (click)="infoModal.hide()" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class = "modal-body">
                <div class = "row" *ngFor="let singleData of data">
                    <div class = "col-md-3">
                        {{singleData.title}}
                    </div>
                    <div class = "col-md-9">
                        {{singleData.value}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div bsModal #curtainModal="bs-modal" class = "modal fade" tabindex = -1 role = "dialog" (onShown) = "curtainHandler('onShown',$event)">
    <div class = "modal-dialog modal-lg">
        <div class = "modal-content">
            <div class = "modal-header">
                <h4 class = "modal-title pull-left">{{curtain.title}}</h4>
                <button type="button" [ngClass] = "{hidden : !curtain.dismissable}" class="close pull-right" (click)="infoModal.hide()" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class = "modal-body">
                <span>{{curtain.message}}</span>
            </div>
        </div>
    </div>
</div>
    `
})

export class NehubaModal{
    
    @ViewChild('inputModal') public inputModalObj:ModalDirective
    @ViewChild('infoModal') public infoModalObj:ModalDirective
    @ViewChild('curtainModal') public curtainModal:ModalDirective
    @Output() fetchTemplate = new EventEmitter<string>()

    title:String = 'More Info'
    data:any[] = [
        {'Name':'Name of the selected object. Extracted from the "name" key of the object'},
        {'Additional Information':'Other Information of the selected object. Extracted from the "properties" key of the object. The value accessed by the "properties" key is expected to be a dictionary/JSON. Each key/value pair will be rendered as a entry.'}]

    inputTitle:string = 'Add New Template'
    inputLabel:string = 'URL'
    inputInput:string = ''
    inputResponse:string = ''

    public showModal( modalTitle:string = 'More Info', item : any ){

        this.title = modalTitle

        this.data = []
        this.data.push({
            title : 'name',
            value : item.name
        })

        if( item.properties ){
            for(let key in item.properties){
                this.data.push({
                    title:key,
                    value:JSON.stringify( item.properties[key] )
                })
            }
        }
        setTimeout(()=>{
            this.infoModalObj.show()
        },0)
    }

    public showInputModal(modalTitle:string){
        this.inputTitle = 'Add New Template'
        this.inputLabel = modalTitle
        this.inputModalObj.show()
    }

    /* this function should be more generic. such as confirmModal(data:string) */
    callFetchTemplate(url:string){
        this.fetchTemplate.emit( url )
    }

    curtain = {
        dismissable : false,
        title : 'Curtain',
        message : 'Curtain message'
    }

    public curtainHandler : any
    curtainLower( curtainMessage:any ):Promise<ModalDirective>{
        this.curtain.title = curtainMessage.title ? curtainMessage.title : 'Curtain'
        this.curtain.message = curtainMessage.message ? curtainMessage.message : 'Curtain message'

        let config = curtainMessage.dismissable ? 
            {
                animated : true,
                keyboard : false,
                backdrop : true,
                ignoreBackdropClick : true
            }
            :
            {
                animated : true,
                keyboard : true,
                backdrop : true,
                ignoreBackdropClick : false
            }
        return new Promise(resolve=>{
            
            this.curtainHandler = (type:string,$event:ModalDirective)=>{
                console.log(type,$event)
                resolve( this.curtainModal )
            }
            this.curtainModal.config = config
            this.curtainModal.show()
        })
    }
}