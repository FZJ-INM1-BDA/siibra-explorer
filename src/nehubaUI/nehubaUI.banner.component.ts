import { Component } from '@angular/core'
import { EventCenter,EVENTCENTER_CONST } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

@Component({
    selector : 'atlasbanner',
    templateUrl : 'src/nehubaUI/templates/nehubaBanner.template.html',
})

export class NehubaBanner {
    darktheme : boolean

    hbpimg : string = 'src/assets/images/HBP_AtlasViewer_light.svg'
    hbpimgdark : string = 'src/assets/images/HBP_AtlasViewer_dark.svg'

    exploreimg : string = 'src/assets/images/exploreTheBrain.png'
    exploreimgdark : string = 'src/assets/images/exploreTheBrain.png'

    euimg : string = 'src/assets/images/cofundedByEU.png'
    euimgdark : string = 'src/assets/images/cofundedByEU.png'

    constructor(private eventCenter:EventCenter){
        this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
            switch(msg.target){
                case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
                    this.darktheme = msg.body.theme == 'dark' 
                }break;
            }
        })
    }
}