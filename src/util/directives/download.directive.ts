import { Directive, ElementRef, Renderer2 } from "@angular/core";

@Directive({
  selector : 'a[download]'
})

export class DownloadDirective{

  public downloadIcon:HTMLElement

  constructor(public el:ElementRef, public rd2:Renderer2){
    this.downloadIcon = rd2.createElement('i')
    rd2.addClass(this.downloadIcon, 'glyphicon')
    rd2.addClass(this.downloadIcon, 'glyphicon-download-alt')
  }

  ngAfterViewInit(){
    this.rd2.appendChild(this.el.nativeElement, this.downloadIcon)
  }
}