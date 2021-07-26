import { Component, ComponentFactory, ComponentFactoryResolver, Inject, Injector, Input, OnChanges, OnDestroy, Optional, ViewChild, ViewContainerRef } from "@angular/core";
import { IBSSummaryResponse, TContextedFeature, TRegion } from "../type";
import { BsFeatureService, TFeatureCmpInput } from "../service";
import { combineLatest, Observable, Subject } from "rxjs";
import { debounceTime, map, shareReplay, startWith, tap } from "rxjs/operators";
import { REGISTERED_FEATURE_INJECT_DATA } from "../constants";
import { ARIA_LABELS } from 'common/constants'
import {
  IEEG_FEATURE_NAME
} from '../ieeg'
import {
  RECEPTOR_FEATURE_NAME
} from '../receptor'
import {
  EbrainsRegionalFeatureName
} from '../kgRegionalFeature'
import { OVERWRITE_SHOW_DATASET_DIALOG_TOKEN, TOverwriteShowDatasetDialog } from "src/util/interfaces";

@Component({
  selector: 'regional-feature-wrapper',
  templateUrl: './regionalFeatureWrapper.template.html',
  styleUrls: [
    './regionalFeatureWrapper.style.css'
  ]
})

export class RegionalFeatureWrapperCmp implements OnChanges, OnDestroy{

  public useVirtualScroll = false

  public ARIA_LABELS = ARIA_LABELS

  @Input()
  region: TRegion

  @ViewChild('regionalFeatureContainerTmpl', { read: ViewContainerRef })
  regionalFeatureContainerRef: ViewContainerRef

  private weakmap = new WeakMap<(new () => any),  ComponentFactory<any>>()

  private ondestroyCb: (() => void)[] = []
  constructor(
    private svc: BsFeatureService,
    private cfr: ComponentFactoryResolver,
    @Optional() @Inject(OVERWRITE_SHOW_DATASET_DIALOG_TOKEN) private overwriteFn: TOverwriteShowDatasetDialog
  ){
    const sub = this.registeredFeatures$.subscribe(arr => this.registeredFeatures = arr)
    this.ondestroyCb.push(() => sub.unsubscribe())
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
        ctrl.results$.pipe(
          startWith([])
        )
      ]).subscribe(
        ([busy, results]) => {
          this.registeredFeatureRawRegister[name] = { busy, results, icon }
          this.registeredFeatureFireStream$.next(true)
        }
      )
      this.regionOnDestroyCb.push(() => sub.unsubscribe())
    }
  }
  private cleanUpRegionalFeature(){
    while (this.regionOnDestroyCb.length) this.regionOnDestroyCb.pop()()
    /**
     * emit null to signify flush out of existing scan map
     */
    this.registeredFeatureRawRegister = {}
    this.registeredFeatureFireStream$.next(true)
  }

  private registeredFeatureRawRegister: {
    [key: string]: {
      icon: string
      busy: boolean
      results: any[]
    }
  } = {}
  private registeredFeatureFireStream$ = new Subject()
  private registeredFeatureMasterStream$ = this.registeredFeatureFireStream$.pipe(
    debounceTime(16),
    /**
     * must not use mapTo operator
     * otherwise the emitted value will not change
     */
    map(() => this.registeredFeatureRawRegister),
    shareReplay(1),
  )
  public busy$: Observable<boolean> = this.registeredFeatureMasterStream$.pipe(
    map(obj => {
      for (const key in obj) {
        if(obj[key].busy) return true
      }
      return false
    }),
  )

  public registeredFeatures: TContextedFeature<keyof IBSSummaryResponse>[] = []
  private registeredFeatures$: Observable<TContextedFeature<keyof IBSSummaryResponse>[]> = this.registeredFeatureMasterStream$.pipe(
    map(obj => {
      const returnArr = []
      for (const name in obj) {
        if (obj[name].busy || obj[name].results.length === 0) {
          continue
        }
        for (const result of obj[name].results) {
          const objToBeInserted = {
            featureName: name,
            icon: obj[name].icon,
            result
          }
          /**
           * place ebrains regional features at the end
           */
          if (name === EbrainsRegionalFeatureName) {
            returnArr.push(objToBeInserted)
          } else {
            returnArr.unshift(objToBeInserted)
          }
        }
      }

      return returnArr
    }),
  )

  ngOnChanges(){
    this.cleanUpRegionalFeature()
    this.setupRegionalFeatureCtrl()
  }

  ngOnDestroy(){
    this.cleanUpRegionalFeature()
    while(this.ondestroyCb.length) this.ondestroyCb.pop()()
  }

  public handleFeatureClick(contextedFeature: TContextedFeature<any>){
    if (!this.overwriteFn) {
      console.warn(`show dialog function not overwritten!`)
      return
    }
    
    const featureId = contextedFeature.result['@id']
    const arg = {}
    if (contextedFeature.featureName === RECEPTOR_FEATURE_NAME) {
      arg['name'] = contextedFeature.result['name']
      arg['description'] = contextedFeature.result['info']
      arg['urls'] = []
      for (const info of contextedFeature.result['origin_datainfos']) {
        arg['urls'].push(...info.urls)
      }
    }

    if (contextedFeature.featureName === IEEG_FEATURE_NAME) {
      arg['name'] = contextedFeature.result['name']
      arg['description'] = ' '
      arg['isGdprProtected'] = true
      /**
       * todo use actual fetched data
       */
      const re = /\(dataset:([a-f0-9-]+)\)/.exec(arg['name'])
      if (re) {
        arg['urls'] = [{
          doi: `https://search.kg.ebrains.eu/instances/${re[1]}`
        }]
      }
    }

    if (contextedFeature.featureName === EbrainsRegionalFeatureName) {
      arg['summary'] = contextedFeature.result
    }

    const { region } = this
    
    const feat = this.svc.registeredFeatures.find(f => f.name === contextedFeature.featureName)
    if (!feat) {
      console.log(`cannot find feature with name ${contextedFeature.featureName}`)
      return
    }
    
    const cf = (() => {
      if (!feat.View) return null
      const mapped = this.weakmap.get(feat.View)
      if (mapped) return mapped
      const _cf = this.cfr.resolveComponentFactory(feat.View)
      this.weakmap.set(feat.View ,_cf)
      return _cf
    })()

    this.overwriteFn({
      region,
      dataType: contextedFeature.featureName,
      view: (() => {
        if (!cf) return null
        const injector = Injector.create({
          providers: [{
            provide: REGISTERED_FEATURE_INJECT_DATA,
            useValue: { region, featureId } as TFeatureCmpInput
          }],
        })
        const cmp = cf.create(injector)
        return cmp.hostView
      })(),
      ...arg,
    })
  }
}
