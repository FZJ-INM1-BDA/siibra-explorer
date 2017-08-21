
import { Component,ViewChild,Output,EventEmitter } from '@angular/core'
import { ModalDirective } from 'ngx-bootstrap/modal'
import { EventCenter,NehubaFetchData } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

@Component({
    selector: 'nehubaModal',
    template : `
<div bsModal #inputModal="bs-modal" (onHide)="inputModalHideHandler($event)" class = "modal fade" tabindex = -1 role = "dialog">
    <div class = "modal-dialog modal-lg">
        <div class = "modal-content">
            <div class = "modal-header">
                <h4 class = "modal-title pull-left">{{inputTitle}}</h4>
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
                            <div (click)="fetchData(inputInput)" class = "btn btn-block btn-primary">GET</div>
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
                <div class = "row">
                    <tabset class = "col-md-12">
                        <tab *ngFor="let key of data | keyPipe" [heading] = "key">
                            <div class = "row">
                                <multiform [data] = "data[key] | filterUncertainObject">
                                </multiform>
                            </div>
                        </tab>
                    </tabset>
                </div>
                <div *ngIf = "false" class = "row">
                    <div *ngFor="let key of data | keyPipe">
                        <div class = "col-md-3">
                            {{key}}
                        </div>
                        <div class = "col-md-9">
                            {{ data[key] | jsonStringifyPipe }}
                        </div>
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

    @Output() public fetchedSomething : EventEmitter<any> = new EventEmitter()

    title:String = 'More Info'
    data:any[] = [
        {'Name':'Name of the selected object. Extracted from the "name" key of the object'},
        {'Additional Information':'Other Information of the selected object. Extracted from the "properties" key of the object. The value accessed by the "properties" key is expected to be a dictionary/JSON. Each key/value pair will be rendered as a entry.'}]

    inputTitle:string = 'Add New Template'
    inputLabel:string = 'URL'
    inputInput:string = ''
    inputResponse:string = ''

    constructor(
        private eventCenter:EventCenter,
        private nehubaFetchData:NehubaFetchData
    ){
        this.eventCenter.modalEventRelay.subscribe((msg:EventPacket)=>{
            switch (msg.target){
                case 'showInfoModal':{
                    this.title = msg.body.title
                    this.data = msg.body.body
                    setTimeout(()=>{
                        this.infoModalObj.show()
                    },0)
                }break;
                case 'showInputModal':{
                    this.inputTitle = msg.body.title
                    this.inputModalObj.show()
                }break;
                case 'showCurtainModal':{
                    this.showCurtain()
                }break;
            }
        })
    }

    public showCurtain(){
        console.log('curtain is shown')
    }

    public showModal( modalTitle:string = 'More Info', properties : any ){

        this.title = modalTitle
        this.data = properties

        setTimeout(()=>{
            this.infoModalObj.show()
        },0)
    }

    public showInputModal(modalTitle:string){
        this.inputTitle = 'Add New ' + modalTitle
        this.inputLabel = modalTitle
        this.inputModalObj.show()
    }

    inputModalHideHandler(ev:any){
        console.log(ev)
    }

    /* this function should be more generic. such as confirmModal(data:string) */
    fetchData(url:string){
        this.inputResponse = ''
        this.nehubaFetchData.fetchJson(url)
            .then(json=>{
                this.inputResponse += 'Fetch Json Successful. '
                this.parseJson(json)
            })
            .catch(e=>{
                console.log(e)
                this.nehubaFetchData.fetchJson(url+'/info')
                    .then(json=>{
                        json
                        /* add raw layer here */
                        this.inputResponse += 'Adding raw layer successful. '
                    })
                    .catch(err=>{
                        this.inputResponse += 'Fetch Json Failed. '
                        this.inputResponse += e.toString()
                        this.inputResponse += err.toString()
                    })
            })
    }

    /* After fetching json, lazy parse the json to determine if it was a template, a parcellation, or a layer */
    parseJson(json:any){
        switch(json.type){
            case 'template':{
                this.inputResponse += 'Adding new Template. '
                this.nehubaFetchData.parseTemplateData(json)
                    .then( template =>{
                        this.fetchedOutputToController(template)
                    })
                    .catch( e=>{
                        this.inputResponse += 'Error.'
                        this.inputResponse += e.toString()
                        console.log(e)
                    })
            }break;
            case 'parcellation':{
                this.inputResponse += 'Adding new Parcellation.'
                this.nehubaFetchData.parseParcellationData(json)
                    .then(parcellation =>{
                        this.fetchedOutputToController(parcellation)
                    })
                    .catch( e=>{
                        this.inputResponse += 'Error.'
                        this.inputResponse += e.toString()
                        console.log(e)
                    })
            }break;
            default:{
                this.inputResponse += 'No type property found. Unable to process this JSON.'
            }break;
        }
    }

    /* not using observables, since all fetched objects should go to the main controller */
    fetchedOutputToController(item:any){
        this.fetchedSomething.emit(item)
    }

    curtain = {
        dismissable : false,
        title : 'Curtain',
        message : 'Curtain message'
    }

    /* TODO: fix curtain modal */
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
                type
                $event
                resolve( this.curtainModal )
            }
            this.curtainModal.config = config
            this.curtainModal.show()
        })
    }
}