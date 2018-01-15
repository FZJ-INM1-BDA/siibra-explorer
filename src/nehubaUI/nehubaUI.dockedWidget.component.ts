import { Component,Input } from '@angular/core'
import { FloatingWidgetComponent } from 'nehubaUI/nehubaUI.floatingWidget.component';

@Component({
  selector : 'DockedWidgetContainer',
  template : 
`
<div (mousedown) = "w.stopBlinking()" *ngFor="let w of allFloatingWidgets" [hidden]="w.floating" [ngClass]="{ darktheme : w.darktheme }">
  <div [ngClass] = "{'panel-default' : !w.successFlag, 'panel-success':w.successFlag}" class = "panel" >
    <div (click) = "w.showBody = !w.showBody" class = "panel-heading">
      <div class = "nehuba-pull-left">{{w.data.name.split('.')[w.data.name.split('.').length-1]}}</div>
      <i (click) = "w.minimise()" class = "nehuba-pull-right close"><i class = "glyphicon glyphicon-minus"></i></i>
      <i (click) = "w.offTray() " class = "nehuba-pull-right close"><i class = "glyphicon glyphicon-new-window"></i></i>
      <i (click) = "w.cancel()" class = "nehuba-pull-right close"><i class = "glyphicon glyphicon-remove"></i></i>
    </div>
    <div [hidden] = "!w.showBody" [innerHTML]="w.template" class = "panel-body">
    </div>
  </div>
</div>
`
})

export class DockedWidgetContainer{
  @Input() allFloatingWidgets : FloatingWidgetComponent[] = []
  constructor(){
  }
}