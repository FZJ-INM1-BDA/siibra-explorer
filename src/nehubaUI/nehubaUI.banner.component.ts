import { Component, AfterViewInit } from '@angular/core'
import { EXTERNAL_CONTROL as gExternalControl, UI_CONTROL, MainController } from './nehubaUI.services'

@Component({
  selector : 'atlasbanner',
  templateUrl : 'src/nehubaUI/templates/nehubaBanner.template.html',
  styles : [
    `
    div[bannerContainer]
    {
      position:relative;
      height:calc(100% + 1px);
      padding-bottom:1px;
      width:calc(100% + 10em);
    }
    div[bannerContainer]:hover
    {
      cursor:pointer;
    }
    div[bannerContainer]:before
    {
      content: ' ';
      position:absolute;
      width:100%;
      height:100%;
    }
    div[bannerContainer]:hover:before
    {
      background-color:rgba(128,128,128,0.1);
    }
    img
    {
      height:100%;
      display:inline-block;
      padding-top: 1em;
      padding-bottom: 1em;
      padding-left:1em;
      box-sizing:border-box;
    }
    div
    {
      height:100%;
      display:inline-block;
    }
    div > *
    {
      display:inline-block;
    }
    div[textContainer]
    {
      vertical-align:middle;
      padding:1em;
    }
    small[selectedInformation]
    {
      line-height:1.1em;
      margin-left:0.3em;
    }
    `
  ]
})

export class NehubaBanner implements AfterViewInit {
  darktheme : boolean

  hbpimg : string = 'src/assets/images/HBP_Primary_RGB_BlackText.png'
  hbpimgdark : string = 'src/assets/images/HBP_Primary_RGB_WhiteText.png'

  constructor(public mainController:MainController){

  }

  parseSrcToBGUrl(str:string){
    return `url('${str}')`
  }

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
    })
  }
}