import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector : 'kg-entry-viewer',
  templateUrl : './kgentry.template.html',
  styleUrls : [
    './kgentry.style.css'
  ]
})

export class KgEntryViewer implements OnInit{
  @Input() kgQueryString : string = null

  public kgData : any = null

  ngOnInit(){
    if(this.kgQueryString){
      fetch(`${KGROOT}${this.kgQueryString}`)
        .then(res => res.json())
        .then(json => {
          console.log({json})
          if(json.found)
            return json._source
          else
            throw new Error('json.found returns false')
        })
        .then(json => this.kgData = json)
        .catch(e => {
          console.error('fetching KG data error', e)
          this.kgData = null
        })
    }else{
      console.error('kgQueryString empty!')
    }
  }

  get tableColClass1(){
    return `col-xs-4 col-lg-4 tableEntry`
  }

  get tableColClass2(){
    return `col-xs-8 col-lg-8 tableEntry`
  }
}

const KGROOT = `https://kg.humanbrainproject.org/api/proxy/kg/`