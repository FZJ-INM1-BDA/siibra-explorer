import { Component, ComponentFactory, ComponentFactoryResolver, Injector, Input, OnChanges, ViewChild, ViewContainerRef } from "@angular/core";
import { TRegion } from "../type";
import { BsFeatureService, TFeatureCmpInput } from "../service";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { map, scan } from "rxjs/operators";
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

  public registeredFeatures$: Observable<{
    name: string
    icon: string
    
  }[]>
  constructor(
    private svc: BsFeatureService,
    private cfr: ComponentFactoryResolver,
    private injector: Injector,
  ){
    this.registeredFeatures$ = this.registeredFeatureMasterStream$.pipe(
      scan((acc, curr) => {
        return {
          ...acc,
          ...curr
        }
      }),
      map(obj => {
        const returnArr = []
        for (const name in obj) {
          if (obj[name].busy || obj[name].results.length === 0) {
            continue
          }
          returnArr.push({
            name,
            icon: obj[name].icon
          })
        }
        return returnArr
      })
    )
  }

  private regionOnDestroyCb: (() => void)[] = []
  private setupRegionalFeatureCtrl(){
    if (!this.region) return
    const { region } = this
    for (const feat of this.svc.registeredFeatures){
      const { name, icon } = feat
      const ctrl = new feat.Ctrl(this.svc, { region })
      const sub = combineLatest([
        ctrl.busy$,
        ctrl.results$
      ]).subscribe(
        ([busy, results]) => {
          this.registeredFeatureMasterStream$.next({
            [name]: { busy, results, icon }
          })
        }
      )
      this.regionOnDestroyCb.push(() => sub.unsubscribe())
    }
  }
  private cleanUpRegionalFeature(){
    while (this.regionOnDestroyCb.length) this.regionOnDestroyCb.pop()()
    this.registeredFeatureMasterStream$.next({})
  }

  private registeredFeatureMasterStream$ = new BehaviorSubject<{
    [key: string]: {
      icon: string
      busy: boolean
      results: any[]
    }
  }>({})
  public busy$: Observable<boolean> = this.registeredFeatureMasterStream$.pipe(
    map(obj => {
      for (const key in obj) {
        if(obj[key].busy) return true
      }
      return false
    }),
  )

  ngOnChanges(){
    this.cleanUpRegionalFeature()
    this.setupRegionalFeatureCtrl()
  }

  public activatedFeatureName: string = null
  activateFeature(featNameObj: {
    name: string
  }){
    const feat = this.svc.registeredFeatures.find(f => f.name === featNameObj.name)
    if (!feat) {
      console.log(`cannot find feature with name ${featNameObj.name}`)
      return
    }
    this.activatedFeatureName = featNameObj.name
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
