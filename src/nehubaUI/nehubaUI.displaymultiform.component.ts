import { Component,Input } from '@angular/core'

@Component({
      selector : 'multiform',
      template : `
<div *ngIf = "data.constructor.name == 'String'" class = "col-md-12">
      {{data}}
</div>
<div *ngIf = "data.constructor.name == 'Array'" class = "col-md-12">
      <table class = "table table-sm table-bordered">
            <tbody>
                  <tr *ngFor = "let d of data">
                        <td>
                              <multiform [data] = "d | filterUncertainObject">
                              </multiform>
                        </td>
                  </tr>
            </tbody>
      </table>
</div>
<div *ngIf = "data.constructor.name == 'Object'" class = "col-md-12">
      <activecomponent *ngIf = "data._activeCell" [data]="data">
      </activecomponent>
      <table *ngIf ="!data._activeCell" class = "table table-sm table-bordered">
            <tbody>
                  <tr *ngFor = "let key of data | keyPipe">
                        <td class = "col-md-3">
                              {{key}}
                        </td>
                        <td class = "col-md-9">
                              <multiform [data] = "data[key] | filterUncertainObject">
                              </multiform>
                        </td>
                  </tr>
            </tbody>
      </table>
</div>
      `
})

export class Multiform{
      @Input() data:any|any[]
      @Input() template:any
}

@Component({
      selector : 'activecomponent',
      template : `
<div *ngIf = "data._elementTagName == 'div'" [ngClass] = "data._class">{{data._value}}
</div>
<span *ngIf = "data._elementTagName == 'span'" [ngClass] = "data._class">{{data._value}}
</span>
<img *ngIf = "data._elementTagName == 'img'" [src] = "data._src" [ngClass] = "data._class">
      `
})

export class ActiveComponent{
      @Input() data:any
}