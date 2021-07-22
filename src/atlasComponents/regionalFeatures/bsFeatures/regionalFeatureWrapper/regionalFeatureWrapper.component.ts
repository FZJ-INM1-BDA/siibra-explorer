import { Component, ComponentFactory, ComponentFactoryResolver, Injector, Input, OnChanges, ViewChild, ViewContainerRef } from "@angular/core";
import { TRegion } from "../type";
import { BsFeatureService, TFeatureCmpInput, TRegisteredFeature } from "../service";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { REGISTERED_FEATURE_INJECT_DATA } from "../constants";

@Component({
  selector: 'regional-feature-wrapper',
  templateUrl: './regionalFeatureWrapper.template.html',
  styleUrls: [
    './regionalFeatureWrapper.style.css'
  ]
})

export class RegionalFeatureWrapperCmp implements OnChanges{

  @Input()
  region: TRegion

  @ViewChild('regionalFeatureContainerTmpl', { read: ViewContainerRef })
  regionalFeatureContainerRef: ViewContainerRef

  private weakmap = new WeakMap<(new () => any),  ComponentFactory<any>>()

  public registeredFeatures$ = this.svc.registeredFeatures$
  constructor(
    private svc: BsFeatureService,
    private cfr: ComponentFactoryResolver,
    private injector: Injector,
  ){
    
  }

  private regionOnDestroyCb: (() => void)[] = []
  private setupRegionalFeatureCtrl(){
    if (!this.region) return
    const { region } = this
    for (const feat of this.svc.registeredFeatures){
      const ctrl = new feat.Ctrl(this.svc, { region })
      const sub = ctrl.busy$.subscribe(
        flag => {
          this.busyMasterStream$.next({
            [feat.name]: flag
          })
        }
      )
      this.regionOnDestroyCb.push(() => sub.unsubscribe())
    }
  }
  private cleanUpRegionalFeature(){
    while (this.regionOnDestroyCb.length) this.regionOnDestroyCb.pop()()
    this.busyMasterStream$.next({})
  }

  private busyMasterStream$ = new BehaviorSubject<{
    [key: string]: boolean
  }>({})
  public busy$: Observable<boolean> = this.busyMasterStream$.pipe(
    map(obj => {
      for (const key in obj) {
        if(obj[key]) return true
      }
      return false
    }),
  )

  ngOnChanges(){
    this.cleanUpRegionalFeature()
    this.setupRegionalFeatureCtrl()
  }

  public activatedFeatureName: string = null
  activateFeature(feat: TRegisteredFeature){
    this.activatedFeatureName = feat.name
    if (!this.regionalFeatureContainerRef) {
      console.warn(`regionalFeatureContainerRef not defined.`)
      return
    }
    this.regionalFeatureContainerRef.clear()
    
    const cf = (() => {
      const mapped = this.weakmap.get(feat.View)
      if (mapped) return mapped
      const _cf = this.cfr.resolveComponentFactory(feat.View)
      this.weakmap.set(feat.View ,_cf)
      return _cf
    })()

    const { region } = this

    const injector = Injector.create({
      providers: [{
        provide: REGISTERED_FEATURE_INJECT_DATA,
        useValue: { region } as TFeatureCmpInput
      }],
      parent: this.injector
    })
    this.regionalFeatureContainerRef.createComponent(cf, null, injector)
  }
}
