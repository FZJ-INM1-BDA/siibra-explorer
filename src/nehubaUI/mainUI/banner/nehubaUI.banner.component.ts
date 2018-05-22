import { Pipe, PipeTransform,ViewChild,TemplateRef,Output,EventEmitter, Component, AfterViewInit } from '@angular/core'
import { MainController,HELP_MENU,WidgitServices, InfoToUIService } from 'nehubaUI/nehubaUI.services'
import { RegionDescriptor, TemplateDescriptor, DatasetInterface, ParcellationDescriptor }from 'nehubaUI/nehuba.model'

import { DatasetBlurb } from 'nehubaUI/components/datasetBlurb/nehubaUI.datasetBlurb.component';
import { animationFadeInOut } from 'nehubaUI/util/nehubaUI.util.animations'

import template from './nehubaUI.banner.template.html'
import css from './nehubaUI.banner.style.css'

import img from 'assets/images/HBP_Primary_RGB_BlackText.png'
import imgdark from 'assets/images/HBP_Primary_RGB_WhiteText.png'

@Component({
  selector : 'atlasbanner',
  template : template,
  styles : [ css ,
  `
  ul li.selected a:before
  {
    content: '\u2022';
    width : 1em;
    display:inline-block;
  }
  ul li:not(.selected) a:before
  {
    content: ' ';
    width : 1em;
    display:inline-block;
  }
  `], /* TODO with both raw-loader and sass, the utf-8 encoding are lost... investigate, merge these back to the rest of css */
  animations : [ animationFadeInOut ]
})

export class NehubaBanner implements AfterViewInit {
  darktheme : boolean
  @Output() showRegionDialog : EventEmitter<any> = new EventEmitter()
  @ViewChild('searchRegion',{read:TemplateRef}) searchRegion : TemplateRef<any>
  hbpimg : string = img
  hbpimgdark : string = imgdark

  showTemplateSelection : boolean = false
  widgetiseSearchRegion : boolean = false

  searchTerm : string = ``
  regions : RegionDescriptor[] = []

  @ViewChild('modeInfoUnit') modeInfoUnit: DatasetBlurb
  @ViewChild('modeInfo') modeInfo: TemplateRef<any>

  modalDataset : DatasetInterface

  constructor(public mainController:MainController,public widgitServices:WidgitServices,public infoToUI:InfoToUIService){
    this.mainController.selectedParcellationBSubject.subscribe((parcellation)=>{
      this.regions = parcellation ? parcellation.regions : []
    })
  }

  loadTemplate(template:TemplateDescriptor){
    if(this.mainController.selectedTemplate !== template) {
      this.mainController.selectedTemplateBSubject.next(template)
      
      /* TODO when userselects a new template, they should hop out of special viewing mode, see #71 */
      /* this is not a really elegant solution */
      this.mainController.dedicatedViewBSubject.next(null)
    }
  }

  loadParcellation(parcellation:ParcellationDescriptor){
    if(this.mainController.selectedParcellation !== parcellation) {
      this.mainController.selectedParcellationBSubject.next(parcellation)
    }
  }

  widgetiseSearchRegionComponent(){
    this.widgetiseSearchRegion = true
    const widgitComponent = this.widgitServices.widgitiseTemplateRef(this.searchRegion,{name:'Search Region',onShutdownCleanup : ()=>{
      this.widgetiseSearchRegion = false
      widgitComponent.parentViewRef.destroy()
      if(this.mainController.nehubaViewer)this.mainController.nehubaViewer.redraw()
    }})
    widgitComponent.changeState("floating")
  }

  ngAfterViewInit(){
    this.mainController.selectedTemplateBSubject.subscribe((template)=>{
      if(template)this.darktheme = template.useTheme == 'dark'
    })

    this.mainController.dedicatedViewBSubject
      .subscribe(dedicatedView=>this.dedicatedView = dedicatedView ? dedicatedView.url : null)
  }
  dedicatedView : string|null = null

  clearDedicatedView(){
    this.mainController.dedicatedViewBSubject.next(null)
  }

  showModeInfo(activity:string){
    const handler = this.infoToUI.getModalHandler()
    handler.title = `${this.mainController.selectedTemplate ? this.mainController.selectedTemplate.name : 'No Template Selected'} <i class = "glyphicon glyphicon-chevron-right"></i> ${activity} `
    handler.showTemplateRef(this.modeInfo)
  }

  showhelp(){
    
    const modalHandler = this.infoToUI.getModalHandler()
    modalHandler.title = `<h4>Help</h4>`
    modalHandler.body = HELP_MENU
    modalHandler.footer
    modalHandler.show()
  }
}


@Pipe({
  name:'prependNavigatePipe'
})

//TODO fetch the available dataset from KG
export class PrependNavigate implements PipeTransform{
  public transform(array:string[],template : TemplateDescriptor | undefined):string[]{
    return template ? template.name == 'MNI Colin 27' ? 
      ['Select atlas regions', ... array /*,'iEEG Recordings'*/] :
      ['Select atlas regions', ... array] :
        []
  }
}


@Pipe({
  name:'searchPipe'
})

export class SearchPipe implements PipeTransform{
  regExp : RegExp

  public transform(array:string[],searchTerm:string){

    let sanitaized = searchTerm.replace(/[^\w\s]/gi, '')
    this.regExp = new RegExp(sanitaized,'gi')

    return searchTerm == '' ? 
      array : 
      array
        .filter( (item) => {
          return this.regExp.test(item)
        })
  }
}

@Pipe({
  name : 'mapToValuePipe'
})

export class MapToValuePipe implements PipeTransform{
  public transform(map:Map<any,any>):any[]{
    return Array.from(map.values()).map(re=>re.moreInfo)
  }
}

@Pipe({
  name : 'concatFlattenArrayPipe'
})

export class ConcatFlattenArrayPipe implements PipeTransform{
  public transform(array:any[]):any[]{
    return array.reduce((acc:any[],curr)=>acc.concat(curr),[])
  }
}

// @Pipe({
//   name : 'uniquefyPipe'
// })

// export class UniquefyPipe implements PipeTransform{
//   public transform(array:any[]):any[]{

//     return array.reduce((acc:any[],curr)=> 
//       acc.findIndex(it=>it==curr.name) >= 0 ? 
//         acc : 
//         curr.name == 'Go To There' ?
//           acc :
//           acc.concat(curr.name)
//       ,[])
//   }
// }