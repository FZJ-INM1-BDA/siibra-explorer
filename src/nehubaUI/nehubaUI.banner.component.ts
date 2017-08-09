import { Component, Input } from '@angular/core'

@Component({
    selector : 'atlasbanner',
    templateUrl : 'src/nehubaUI/templates/nehubaBanner.template.html',
})

export class NehubaBanner {
    @Input() darktheme : boolean

    hbpimg : string = 'src/assets/images/HBP_Horizontal_RGB_BlackText.png'
    hbpimgdark : string = 'src/assets/images/HBP_Horizontal_RGB_WhiteText.png'

    exploreimg : string = 'src/assets/images/exploreTheBrain.png'
    exploreimgdark : string = 'src/assets/images/exploreTheBrain.png'

    euimg : string = 'src/assets/images/cofundedByEU.png'
    euimgdark : string = 'src/assets/images/cofundedByEU.png'

}