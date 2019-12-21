import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core'

@Component({
  selector : 'sample-box',
  templateUrl : './sampleBox.template.html',
  styleUrls : [
    './sampleBox.style.css',
  ],
})

export class SampleBoxUnit implements OnInit, OnChanges {
  @Input() public sampleBoxTitle = ``
  @Input() public scriptInput

  @ViewChild('ngContent', {read: ElementRef}) public ngContent: ElementRef

  public escapedHtml: string = ``
  public escapedScript: string = ``

  private scriptEl: HTMLScriptElement

  constructor(private rd2: Renderer2) {
    this.scriptEl = this.rd2.createElement('script')
  }

  public ngOnInit() {
    this.escapedHtml = this.ngContent.nativeElement.innerHTML
  }

  public ngOnChanges() {
    this.escapedScript = this.scriptInput
    if ( this.scriptInput ) {
      this.scriptEl.innerText = this.scriptInput
    }
  }
}
