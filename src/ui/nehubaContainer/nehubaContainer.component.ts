import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory } from "@angular/core";
import { NehubaViewerUnit } from "./nehubaViewer/nehubaViewer.component";
import { NehubaDataService } from "../../services/services.module";

@Component({
  selector : 'ui-nehuba-container',
  templateUrl : './nehubaContainer.template.html',
  styleUrls : [
    `./nehubaContainer.style.css`
  ]
})

export class NehubaContainner{
  @ViewChild('container',{read:ViewContainerRef}) container : ViewContainerRef
  private nehubaViewerFactory : ComponentFactory<NehubaViewerUnit>
  public viewerLoaded : boolean = false
  constructor(
    private csf:ComponentFactoryResolver,
    public nehubaDS : NehubaDataService
  ){
    this.nehubaViewerFactory = this.csf.resolveComponentFactory(NehubaViewerUnit)
  }

  TEST_create(){
    this.viewerLoaded = true
    this.container.createComponent(this.nehubaViewerFactory)
  }
}