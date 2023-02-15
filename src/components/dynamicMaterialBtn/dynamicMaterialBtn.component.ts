import { Component, Input } from "@angular/core";

export type TypeMatBtnStyle = 'mat-button' | 'mat-raised-button' | 'mat-stroked-button' | 'mat-flat-button' | 'mat-icon-button' | 'mat-fab' | 'mat-mini-fab'
export type TypeMatBtnColor = 'basic' | 'primary' | 'accent' | 'warn'

@Component({
  selector: 'iav-dynamic-mat-button',
  templateUrl: './dynamicMaterialBtn.template.html',
  styleUrls: [
    './dynamicMaterialBtn.style.css'
  ]
})

export class DynamicMaterialBtn{
  @Input('iav-dynamic-mat-button-style')
  matBtnStyle: TypeMatBtnStyle = 'mat-button'

  @Input('iav-dynamic-mat-button-color')
  matBtnColor: TypeMatBtnColor = 'basic'

  @Input('iav-dynamic-mat-button-aria-label')
  matBtnAriaLabel: string

  @Input('iav-dynamic-mat-button-disabled')
  matBtnDisabled: boolean = false
}
