import { Component,AfterViewInit } from '@angular/core'
import { EXTERNAL_CONTROL as gExternalControl, UI_CONTROL } from './nehubaUI.services'

@Component({
    selector : 'atlasbanner',
    templateUrl : 'src/nehubaUI/templates/nehubaBanner.template.html',
})

export class NehubaBanner implements AfterViewInit {
    darktheme : boolean

    hbpimg : string = 'src/assets/images/HBP_Primary_RGB_BlackText.png'
    hbpimgdark : string = 'src/assets/images/HBP_Primary_RGB_WhiteText.png'

    exploreimg : string = 'src/assets/images/exploreTheBrain.png'
    exploreimgdark : string = 'src/assets/images/exploreTheBrain.png'

    euimg : string = 'src/assets/images/cofundedByEU.png'
    euimgdark : string = 'src/assets/images/cofundedByEU.png'

    constructor(){
        // this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
        //     switch(msg.target){
        //         case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
        //             this.darktheme = msg.body.theme == 'dark' 
        //         }break;
        //     }
        // })
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