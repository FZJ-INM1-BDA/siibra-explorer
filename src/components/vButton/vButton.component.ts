import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: 'iav-v-button',
  templateUrl: './vButton.template.html',
  styleUrls: [
    './vButton.style.css'
  ],
  exportAs: 'iavVButton',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class IAVVerticalButton{
  @Input() color: 'default' | 'primary' | 'accent' | 'warng' = 'default'
  get class(){
    return `d-flex flex-column align-items-center iv-custom-comp ${this.color} h-100`
  }
}