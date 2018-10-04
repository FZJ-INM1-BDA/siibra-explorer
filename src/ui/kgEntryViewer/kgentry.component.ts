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
  public kgError : any = null

  ngOnInit(){
    if(this.kgQueryString){
      fetch(`${KGROOT}${this.kgQueryString}`)
        .then(res => res.json())
        .then(json => {
          if(json.found)
            return json._source
          else
            throw new Error('No documents were found.')
        })
        .then(json => this.kgData = json)
        .catch(e => {
          console.error('fetching KG data error', e)
          this.kgData = null
          this.kgError = JSON.stringify(e)
        })
    }else{
      console.error('kgQueryString empty!')
      this.kgError = 'Knowledge Graph ID empty'
    }
  }

  get tableColClass1(){
    return `col-xs-4 col-lg-4 tableEntry`
  }

  get tableColClass2(){
    return `col-xs-8 col-lg-8 tableEntry`
  }

  get kgHref(){
    return `https://kg.humanbrainproject.org/webapp/#${this.kgQueryString}`
  }
}

const KGROOT = `https://kg.humanbrainproject.org/api/proxy/kg/`