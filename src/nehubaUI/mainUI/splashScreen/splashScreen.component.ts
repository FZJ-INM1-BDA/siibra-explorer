import { Component } from '@angular/core'
import { MainController } from 'nehubaUI/nehubaUI.services'

import template from './splashScreen.template.html'
import css from './splashScreen.style.css'
import { TemplateDescriptor } from 'nehubaUI/nehuba.model';

@Component({
  selector : 'nehuba-ui-splash-screen',
  template : template,
  styles : [ css ]
})

export class SplashScreen{

  constructor(public mainController:MainController){
  }

  loadTemplate(template:TemplateDescriptor){
    this.mainController.selectedTemplateBSubject.next(template)
  }


  TEMP_LABELS = TEMP_RADAR.map(arr=>arr[0])
  TEMP_DATASETS = ['4p','4p_sd'].map((label,idx)=>({
    label : label,
    data : TEMP_RADAR.map(el=>el[idx+1])
  }))
}

const TEMP_RADAR = [["AMPA","303","158"],["kainate","323","141"],["NMDA","702","119"],["mGluR2/3","2133","546"],["GABAᴀ","1014","309"],["GABAᴃ","1354","512"],["BZ","1920","682"],["M₁","327","68"],["M₂","130","34"],["M₃","535","208"],["α₄β₂","53","22"],["α₁","248","84"],["α₂","347","141"],["5-HT₁ᴀ","176","62"],["5-HT₂","324","96"],["D₁","61","27"]]