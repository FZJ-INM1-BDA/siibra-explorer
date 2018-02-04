import { OnChanges, Input, Component, Pipe, PipeTransform,SecurityContext } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { UI_CONTROL, MainController, MultilevelProvider } from './nehubaUI.services'
import { ModalHandler } from './nehubaUI.modal.component'
import { RegionDescriptor } from 'nehubaUI/nehuba.model';

@Component({
  selector : 'atlascontrol',
  templateUrl : 'src/nehubaUI/templates/nehubaUI.control.template.html',
  styles : [
    `
    div[regionContainer]
    {
      display:flex;
      height:100%;
      max-height:40em;
      width:100%;
      flex-direction:column;
    }
    
    div[multilevelContainer]
    {
      margin-left:1em;
      margin-right:1em;
    }

    .glyphicon-overlay
    {
      
      position:absolute;
      right:0px;
      bottom:0px;
      height:1em;
      z-index:1;
    
      margin-top:auto;
      margin-bottom:auto;
      margin-right:1em;
    }

    div[inputContainer]
    {
      flex: 0 0 auto;
      position:relative;
    }
    div[multilevelContainer]
    {
      width:calc(100% + 50px);
      padding-left:25px;
      padding-right:30px;
      margin-left:-15px;
      padding-top:1em;
      padding-bottom:1em;
      flex: 1 1 auto;
      overflow-x:hidden;
      overflow-y:auto;
      box-shadow:inset 0px 0px 3.5em -0.8em rgba(0,0,0,0.5);
    }
    :host >>> span.highlight
    {
    background-color:#770;
    }
    `
  ],
  providers : [ MultilevelProvider ]
})

export class NehubaUIControl implements OnChanges{
  @Input() searchTerm : string = ''
  listOfActivities : string[] = []
  showListOfActivities : boolean = false
  searchActivityTerm : string = ``

  constructor(public mainController:MainController,public multilevelProvider:MultilevelProvider){
    this.listOfActivities = Array.from(this.mainController.regionsLabelIndexMap.values())
      .reduce((prev:string[],curr:RegionDescriptor)=>
        prev.concat(curr.moreInfo.filter(info=> info.name != 'Go To There' && prev.findIndex(i=>i==info.name) < 0).map(i=>i.name))
      ,[])
    
  }

  ngOnChanges(){
    this.multilevelProvider.searchTerm = this.searchTerm
  }

  showMoreInfo(_item:any):void{
    // console.log(_item)
    const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
    modalHandler.title = `<h4>More information on ${_item.name}</h4>`
    modalHandler.body = _item.properties
    modalHandler.footer = null
    modalHandler.show()
  }

  clearSearchActivityTerm(){
    this.searchActivityTerm = ''
    this.showListOfActivities = false
  }
  
  selectViewingMode(activity?:string){
    let newActivity
    if(activity){
      newActivity = activity
    }else{
      const newPipe = new PrependNavigate()
      const newP2 = new SearchPipe()
      const filter = newP2.transform(newPipe.transform(this.listOfActivities),this.searchActivityTerm)
      if(filter.length > 0) { 
        newActivity = filter[0] 
      }else{
        newActivity = this.mainController.viewingMode
      }
    }
    
    this.clearSearchActivityTerm()
    this.mainController.setMode(newActivity)
  }
}



@Pipe({
  name:'prependNavigatePipe'
})

export class PrependNavigate implements PipeTransform{
  public transform(array:string[]):string[]{
    return ['navigation (default mode)', ... array]
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
  name : 'highlightPipe'
})

export class HighlighPipe implements PipeTransform{
  
  constructor(private sanitizer:DomSanitizer){}

  public transform(term:string,searchTerm:string){
    
    const sanitaized = searchTerm.replace(/[^\w\s]/gi, '')
    const regExp = new RegExp(sanitaized,'gi')
    const nbsp = term.replace(/s/gi,'&nbsp;')
    return this.sanitizer.bypassSecurityTrustHtml( nbsp.replace(regExp,match=>`<span class = "highlight">${this.sanitizer.sanitize(SecurityContext.HTML,match)}</span>`) )
    // return term
  }
}