import { ComponentFactory, ComponentFactoryResolver, ComponentRef, Injectable, Injector, OnDestroy, ViewContainerRef } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { LoggingService } from "src/logging";
import { AtlasViewerConstantsServices } from "../atlasViewer.constantService.service";
import { WidgetUnit } from "./widgetUnit.component";

@Injectable({
  providedIn : 'root',
})

export class WidgetServices implements OnDestroy {

  public floatingContainer: ViewContainerRef
  public dockedContainer: ViewContainerRef
  public factoryContainer: ViewContainerRef

  private widgetUnitFactory: ComponentFactory<WidgetUnit>
  private widgetComponentRefs: Set<ComponentRef<WidgetUnit>> = new Set()

  private clickedListener: Subscription[] = []

  public minimisedWindow$: BehaviorSubject<Set<WidgetUnit>>
  private minimisedWindow: Set<WidgetUnit> = new Set()

  constructor(
    private cfr: ComponentFactoryResolver,
    private constantServce: AtlasViewerConstantsServices,
    private injector: Injector,
    private log: LoggingService,
  ) {
    this.widgetUnitFactory = this.cfr.resolveComponentFactory(WidgetUnit)
    this.minimisedWindow$ = new BehaviorSubject(this.minimisedWindow)

    this.subscriptions.push(
      this.constantServce.useMobileUI$.subscribe(bool => this.useMobileUI = bool),
    )
  }

  private subscriptions: Subscription[] = []

  public useMobileUI: boolean = false

  public ngOnDestroy() {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe()
    }
  }

  public clearAllWidgets() {
    [...this.widgetComponentRefs].forEach((cr: ComponentRef<WidgetUnit>) => {
      if (!cr.instance.persistency) { cr.destroy() }
    })

    this.clickedListener.forEach(s => s.unsubscribe())
  }

  public rename(wu: WidgetUnit, {title, titleHTML}: {title: string, titleHTML: string}) {
    /**
     * WARNING: always sanitize before pass to rename fn!
     */
    wu.title = title
    wu.titleHTML = titleHTML
  }

  public minimise(wu: WidgetUnit) {
    this.minimisedWindow.add(wu)
    this.minimisedWindow$.next(new Set(this.minimisedWindow))
  }

  public isMinimised(wu: WidgetUnit) {
    return this.minimisedWindow.has(wu)
  }

  public unminimise(wu: WidgetUnit) {
    this.minimisedWindow.delete(wu)
    this.minimisedWindow$.next(new Set(this.minimisedWindow))
  }

  public addNewWidget(guestComponentRef: ComponentRef<any>, options?: Partial<IWidgetOptionsInterface>): ComponentRef<WidgetUnit> {
    const component = this.widgetUnitFactory.create(this.injector)
    const _option = getOption(options)

    // TODO bring back docked state?
    _option.state = 'floating'

    _option.state === 'floating'
      ? this.floatingContainer.insert(component.hostView)
      : _option.state === 'docked'
        ? this.dockedContainer.insert(component.hostView)
        : this.floatingContainer.insert(component.hostView)

    if (component.constructor === Error) {
      throw component
    } else {
      const _component = (component as ComponentRef<WidgetUnit>)

      // guestComponentRef
      // insert view
      _component.instance.container.insert( guestComponentRef.hostView )
      // on host destroy, destroy guest
      _component.onDestroy(() => guestComponentRef.destroy())

      /* programmatic DI */
      _component.instance.widgetServices = this

      /* common properties */
      _component.instance.state = _option.state
      _component.instance.exitable = _option.exitable
      _component.instance.title = _option.title
      _component.instance.persistency = _option.persistency
      _component.instance.titleHTML = _option.titleHTML

      /* internal properties, used for changing state */
      _component.instance.guestComponentRef = guestComponentRef

      if (_option.state === 'floating') {
        let position = this.constantServce.floatingWidgetStartingPos
        while ([...this.widgetComponentRefs].some(widget =>
          widget.instance.state === 'floating' &&
          widget.instance.position.every((v, idx) => v === position[idx]))) {
          position = position.map(v => v + 10) as [number, number]
        }
        _component.instance.position = position
      }

      /* set width and height. or else floating components will obstruct viewers */
      _component.instance.setWidthHeight()

      this.widgetComponentRefs.add( _component )
      _component.onDestroy(() => this.minimisedWindow.delete(_component.instance))

      this.clickedListener.push(
        _component.instance.clickedEmitter.subscribe((widgetUnit: WidgetUnit) => {
          /**
           * TODO this operation
           */
          if (widgetUnit.state !== 'floating') {
            return
          }
          const foundWidgetCompRef = [...this.widgetComponentRefs].find(wr => wr.instance === widgetUnit)
          if (!foundWidgetCompRef) {
            return
          }
          const idx = this.floatingContainer.indexOf(foundWidgetCompRef.hostView)
          if (idx === this.floatingContainer.length - 1 ) {
            return
          }
          this.floatingContainer.detach(idx)
          this.floatingContainer.insert(foundWidgetCompRef.hostView)
        }),
      )

      return _component
    }
  }

  public changeState(widgetUnit: WidgetUnit, options: IWidgetOptionsInterface) {
    const widgetRef = [...this.widgetComponentRefs].find(cr => cr.instance === widgetUnit)
    if (widgetRef) {
      this.widgetComponentRefs.delete(widgetRef)
      widgetRef.instance.container.detach( 0 )
      const guestComopnent = widgetRef.instance.guestComponentRef
      this.addNewWidget(guestComopnent, options)

      widgetRef.destroy()
    } else {
      this.log.warn('widgetref not found')
    }
  }

  public exitWidget(widgetUnit: WidgetUnit) {
    const widgetRef = [...this.widgetComponentRefs].find(cr => cr.instance === widgetUnit)
    if (widgetRef) {
      widgetRef.destroy()
      this.widgetComponentRefs.delete(widgetRef)
    } else {
      this.log.warn('widgetref not found')
    }
  }

  public dockAllWidgets() {
    /* nb cannot directly iterate the set, as the set will be updated and create and infinite loop */
    [...this.widgetComponentRefs].forEach(cr => cr.instance.dock())
  }

  public floatAllWidgets() {
    [...this.widgetComponentRefs].forEach(cr => cr.instance.undock())
  }
}

function safeGetSingle(obj: any, arg: string) {
  return typeof obj === 'object' && obj !== null && typeof arg === 'string'
    ? obj[arg]
    : null
}

function safeGet(obj: any, ...args: string[]) {
  let _obj = Object.assign({}, obj)
  while (args.length > 0) {
    const arg = args.shift()
    _obj = safeGetSingle(_obj, arg)
  }
  return _obj
}

function getOption(option?: Partial<IWidgetOptionsInterface>): IWidgetOptionsInterface {
  return{
    exitable : safeGet(option, 'exitable') !== null
      ? safeGet(option, 'exitable')
      : true,
    state : safeGet(option, 'state') || 'floating',
    title : safeGet(option, 'title') || 'Untitled',
    persistency : safeGet(option, 'persistency') || false,
    titleHTML: safeGet(option, 'titleHTML') || null,
  }
}

export interface IWidgetOptionsInterface {
  title?: string
  state?: 'docked' | 'floating'
  exitable?: boolean
  persistency?: boolean
  titleHTML?: string
}
