import {Directive,
  ViewContainerRef,
  ElementRef,
  Renderer2} from '@angular/core'
import { TooltipDirective } from 'ngx-bootstrap/tooltip'
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';

@Directive({
  selector : '.fas.fa-screenshot'
})

export class fasTooltipScreenshotDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
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
  selector : '.fas.fa-remove-sign'
})

export class fasTooltipRemoveSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
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
  selector : '.fas.fa-remove'
})

export class fasTooltipRemoveDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
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
  selector : '.fas.fa-new-window'
})

export class fasTooltipNewWindowDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
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
  selector : '.fas.fa-log-in'
})

export class fasTooltipLogInDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
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
  selector : '.fas.fa-question-circle'
})

export class fasTooltipQuestionSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
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
  selector : '.fas.fa-info-sign'
})

export class fasTooltipInfoSignDirective extends TooltipDirective{
  constructor(
    public viewContainerRef:ViewContainerRef,
    public rd : Renderer2,
    public elementRef:ElementRef,
    public clf:ComponentLoaderFactory,
  ){
    // @ts-ignore
    super(viewContainerRef,rd,elementRef,clf,{
      placement : 'bottom',
      triggers : 'mouseenter:mouseleave',
      container : 'body'
    })

    this.tooltip = `more information`
    this.ngOnInit()
  }
}