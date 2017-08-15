import { Component,Input } from '@angular/core'

@Component({
      selector : 'multiform',
      template : `
<div *ngIf = "data.constructor.name == 'String'" class = "col-md-12">
      {{data}}
</div>
<div *ngIf = "data.constructor.name == 'Array'" class = "col-md-12">
      <table class = "table table-sm table-hover table-bordered">
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
      <table class = "table table-sm table-hover table-bordered">
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
}