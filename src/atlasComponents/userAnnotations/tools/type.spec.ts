import { Subject, Subscription } from "rxjs"
import { AbsToolClass, IAnnotationEvents, IAnnotationGeometry, TAnnotationEvent } from "./type"

class TmpCls extends IAnnotationGeometry{
  annotationType: 'tmpl-cls'
  getNgAnnotationIds(){
    return []
  }
  toNgAnnotation() {
    return []
  }
  toJSON() {
    return {}
  }
  toString() {
    return ''
  }
  toSands(){
    return {} as any
  }
}

class TmpToolCls extends AbsToolClass<TmpCls> {
  iconClass = ''
  name: 'tmplClsTool'
  subs = []
  onMouseMoveRenderPreview() {
    return []
  }

  protected managedAnnotations: TmpCls[] = []
  public managedAnnotations$ = new Subject<TmpCls[]>()
}

describe('> types.ts', () => {
  describe('> AbsToolClass', () => {
    let tool: TmpToolCls
    let ann: TmpCls
    let managedAnn: jasmine.Spy
    const subs: Subscription[] = []

    beforeEach(() => {
      const ev$ = new Subject<TAnnotationEvent<keyof IAnnotationEvents>>()
      tool = new TmpToolCls(ev$, () => {})
      ann = new TmpCls()
      managedAnn = jasmine.createSpy('managedannspy')
      subs.push(
        tool.managedAnnotations$.subscribe(managedAnn)
      )
    })

    afterEach(() => {
      managedAnn.calls.reset()
      while(subs.length) subs.pop().unsubscribe()
    })

    it('> shuld init just fine', () => {
      expect(true).toEqual(true)
    })
    describe('> managedAnnotations$', () => {
      describe('> on point add', () => {
        it('> should emit new managedannotations', () => {
          tool.addAnnotation(ann)
          expect(managedAnn).toHaveBeenCalled()
          expect(managedAnn).toHaveBeenCalledTimes(1)
          const firstCallArgs = managedAnn.calls.allArgs()[0]
          const firstArg = firstCallArgs[0]
          expect(firstArg).toEqual([ann])
        })
      })
      describe('> on point update', () => {
        it('> should emit new managedannotations', () => {
          tool.addAnnotation(ann)
          ann.name = 'blabla'
          expect(managedAnn).toHaveBeenCalledTimes(2)
          const firstCallArgs = managedAnn.calls.allArgs()[0]
          const secondCallArgs = managedAnn.calls.allArgs()[1]
          expect(firstCallArgs).toEqual(secondCallArgs)
        })
      })
      describe('> on point rm', () => {
        it('> managed annotation === 0', () => {
          tool.addAnnotation(ann)

          const firstCallArgs = managedAnn.calls.allArgs()[0]
          const subManagedAnn0 = firstCallArgs[0]
          expect(subManagedAnn0.length).toEqual(1)

          ann.remove()
          expect(managedAnn).toHaveBeenCalledTimes(2)

          const secondCallArgs = managedAnn.calls.allArgs()[1]
          const subManagedAnn1 = secondCallArgs[0]
          expect(subManagedAnn1.length).toEqual(0)
        })
        it('> does not trigger after rm', () => {
          tool.addAnnotation(ann)
          ann.remove()
          ann.name = 'blabla'
          expect(managedAnn).toHaveBeenCalledTimes(2)
        })
      })
    })
  })

  describe('> IAnnotationGeometry', () => {
    it('> can be init fine', () => {
      new TmpCls()
      expect(true).toBe(true)
    })

    describe('> updateSignal$', () => {
      class TmpCls extends IAnnotationGeometry{
        annotationType = 'tmp-cls'
        getNgAnnotationIds(){
          return []
        }
        toNgAnnotation() {
          return []
        }
        toJSON() {
          return {}
        }
        toString() {
          return `${this.name || ''}:${this.desc || ''}`
        }
        toSands(){
          return {} as any
        }
      }

      let tmp: TmpCls
      let subs: Subscription[] = []
      let updateStub: jasmine.Spy
      beforeEach(() => {
        tmp = new TmpCls()
        updateStub = jasmine.createSpy('updateSpy')
        subs.push(
          tmp.updateSignal$.subscribe(
            val => updateStub(val)
          )
        )
      })
      afterEach(() => {
        while(subs.length) subs.pop().unsubscribe()
        updateStub.calls.reset()
      })
      it('> is fired on setting name', () => {
        tmp.name = 'test'
        expect(updateStub).toHaveBeenCalled()
        expect(updateStub).toHaveBeenCalledTimes(1)
      })

      it('> is fired on setting desc', () => {
        tmp.desc = 'testdesc'
        expect(updateStub).toHaveBeenCalled()
        expect(updateStub).toHaveBeenCalledTimes(1)
      })

      it('> should be fired even if same string', () => {

        tmp.name = null
        tmp.name = undefined
        expect(updateStub).toHaveBeenCalledTimes(2)
      })
    })
  })
})
