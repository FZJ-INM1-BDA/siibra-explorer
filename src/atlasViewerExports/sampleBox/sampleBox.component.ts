import {
  Component, 
  Input,
  ViewChild,
  ElementRef,
  OnInit,
  OnChanges,
  Renderer2
} from '@angular/core'

@Component({
  selector : 'sample-box',
  templateUrl : './sampleBox.template.html',
  styleUrls : [
    './sampleBox.style.css'
  ]
})

export class SampleBoxUnit implements OnInit, OnChanges{
  @Input() sampleBoxTitle = ``
  @Input() scriptInput
  
  @ViewChild('ngContent', { read:ElementRef}) ngContent : ElementRef

  escapedHtml : string = ``
  escapedScript : string = ``

  private scriptEl : HTMLScriptElement

  constructor(private rd2:Renderer2){
    this.scriptEl = this.rd2.createElement('script')
  }

  ngOnInit(){
    this.escapedHtml = this.ngContent.nativeElement.innerHTML
  }

  ngOnChanges(){
    this.escapedScript = this.scriptInput
    if( this.scriptInput ){
      this.scriptEl.innerText = this.scriptInput
    }
  }
}