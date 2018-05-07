import {Directive,
ViewContainerRef,
Renderer,
ElementRef} from '@angular/core'
import { TooltipDirective } from 'ngx-bootstrap/tooltip'
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';

@Directive({
  selector : '.glyphicon.glyphicon-screenshot'
})

export class GlyphiconTooltipScreenshotDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `navigate`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-remove-sign'
})

export class GlyphiconTooltipRemoveSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `remove area`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-remove'
})

export class GlyphiconTooltipRemoveDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `close`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-new-window'
})

export class GlyphiconTooltipNewWindowDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `undock`
    this.ngOnInit()
  }
}

@Directive({
  selector : '.glyphicon.glyphicon-log-in'
})

export class GlyphiconTooltipLogInDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `dock`
    this.ngOnInit()
  }
}
@Directive({
  selector : '.glyphicon.glyphicon-question-sign'
})

export class GlyphiconTooltipQuestionSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `help`
    this.ngOnInit()
  }
}
@Directive({
  selector : '.glyphicon.glyphicon-info-sign'
})

export class GlyphiconTooltipInfoSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.htmlContent = `more information`
    this.ngOnInit()
  }
}