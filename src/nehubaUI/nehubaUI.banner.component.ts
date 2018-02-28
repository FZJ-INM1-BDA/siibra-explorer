import { ViewChild,TemplateRef,Output,EventEmitter, Component, AfterViewInit } from '@angular/core'
import { EXTERNAL_CONTROL as gExternalControl, UI_CONTROL, MainController } from './nehubaUI.services'

@Component({
  selector : 'atlasbanner',
  templateUrl : 'src/nehubaUI/templates/nehubaBanner.template.html',
  styles : [
    `
    div[bannerContainer]
    {
      position:relative;
      height:0px;
      padding-bottom:1px;

      display:flex;
    }
    img[hbplogo]
    {
      height:6em;
      pointer-events:none;
      display:inline-block;
      padding:0px;
      margin:1em;
      box-sizing:border-box;

      flex:0 0 auto;
    }
    div
    {
      display:inline-block;
    }
    div > *
    {
      display:inline-block;
    }
    div[textContainer]
    {
      vertical-align:top;
      padding:1em;

      flex: 1 1 auto;
    }
    div[textContainer] > div
    {
      display:inline-block
    }
    span[editBtn]{
      margin-left:-1em;
      color:white;
      z-index:9;
    }
    [btnCustom]
    {
      border-radius : 0px;
    }
    
    ul li.selected a:before
    {
      content: '\u2022';
      width : 1em;
      margin-left: -1em;
      display:inline-block;
    }

    ul li
    {
      padding-left:0.5em;
    }

    div[inputSearchRegion]
    {
      vertical-align : top;
      width:20em;
    }

    `
  ]
})

export class NehubaBanner implements AfterViewInit {
  darktheme : boolean
  @Output() showRegionDialog : EventEmitter<any> = new EventEmitter()
  @ViewChild('searchRegion',{read:TemplateRef}) searchRegion : TemplateRef<any>
  hbpimg : string = 'src/assets/images/HBP_Primary_RGB_BlackText.png'
  hbpimgdark : string = 'src/assets/images/HBP_Primary_RGB_WhiteText.png'

  showTemplateSelection : boolean = false
  widgetiseSearchRegion : boolean = false

  searchTerm : string = ``

  constructor(public mainController:MainController){
    this.mainController.unwidgitiseSearchRegion = (templateRef:TemplateRef<any>)=>{
      templateRef
      this.widgetiseSearchRegion = false
    }
  }

  test(){
    console.log(this.searchRegion)
    this.mainController.widgitiseTemplateRef(this.searchRegion,{name:'Search Region',onShutdownCleanup : ()=>{/* on widget shutdown */}})
  }

  parseSrcToBGUrl(str:string){
    return `url('${str}')`
  }

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
    })
  }

  showRegion(){
    if(this.mainController.selectedTemplate && this.mainController.selectedParcellation){
      this.showRegionDialog.emit()
    }
  }

  focusSearchInput(){
    console.log('focus search input')
    // console.log('atlascontrol click',ev)
  }
}