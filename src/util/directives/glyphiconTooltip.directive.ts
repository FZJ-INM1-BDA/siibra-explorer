import {Directive,
  ViewContainerRef,
  ElementRef,
  Renderer2} from '@angular/core'
import { TooltipDirective } from 'ngx-bootstrap/tooltip'
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';

@Directive({
  selector : '.glyphicon.glyphicon-screenshot'
})

export class GlyphiconTooltipScreenshotDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `navigate`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-remove-sign'
})

export class GlyphiconTooltipRemoveSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `remove area`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-remove'
})

export class GlyphiconTooltipRemoveDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `close`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-new-window'
})

export class GlyphiconTooltipNewWindowDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `undock`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-log-in'
})

export class GlyphiconTooltipLogInDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `dock`
    this.ngOnInit()
  }
}
@Directive({
  selector : '.glyphicon.glyphicon-question-sign'
})

export class GlyphiconTooltipQuestionSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `help`
    this.ngOnInit()
  }
}
@Directive({
  selector : '.glyphicon.glyphicon-info-sign'
})

export class GlyphiconTooltipInfoSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `more information`
    this.ngOnInit()
  }
}