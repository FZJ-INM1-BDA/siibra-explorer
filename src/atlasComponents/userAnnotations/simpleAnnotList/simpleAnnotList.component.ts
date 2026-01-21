import { Component, createComponent, EnvironmentInjector, inject, Injector, Input } from "@angular/core";
import { AnnotationListDirective } from "../directives/annotation.directive";
import { ModularUserAnnotationToolService } from "../tools/service";
import { BehaviorSubject } from "rxjs";
import { DestroyDirective } from "src/util/directives/destroy.directive";
import { IAnnotationGeometry, UDPATE_ANNOTATION_TOKEN } from "../tools/type";
import { ComponentStore } from "src/viewerModule/componentStore";

@Component({
  selector: 'simple-annotation-list',
  templateUrl: './simpleAnnotList.template.html',
  styleUrls: [
    './simpleAnnotList.style.scss'
  ],
  hostDirectives: [
    DestroyDirective
  ],
  providers: [
    ComponentStore
  ]
})

export class SimpleAnnotationList extends AnnotationListDirective{
  #envInj = inject(EnvironmentInjector)
  #destroyed$ = inject(DestroyDirective).destroyed$

  #show$ = new BehaviorSubject(false)
  @Input()
  set show(val: boolean){
    this.#show$.next(val)
  }

  constructor(
    annotSvc: ModularUserAnnotationToolService,
    private injector: Injector,
  ){
    super(annotSvc)
  }

  async gotoRoi(annot: IAnnotationGeometry){
    const result = await this.annotSvc.getTool(annot.annotationType)
    if (!result) {
      return
    }
    const { editCmp } = result
    const inj = Injector.create({
      providers: [
        {
          provide: UDPATE_ANNOTATION_TOKEN,
          useValue: annot
        },
        ComponentStore
      ],
      parent: this.injector
    })

    const cmp = createComponent(editCmp, { environmentInjector: this.#envInj, elementInjector: inj })
    cmp.instance.gotoRoi()
    cmp.destroy()
  }
  async toggleManagedAnnotationVisibility(id: string) {
    await this.annotSvc.toggleAnnotationVisibilityById(id)
  }
  public hiddenAnnotations$ = this.annotSvc.hiddenAnnotations$
}
