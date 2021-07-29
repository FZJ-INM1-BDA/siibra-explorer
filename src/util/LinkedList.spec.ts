import { DoublyLinkedList, FindInLinkedList } from './LinkedList'

describe('> LinkedList.ts', () => {
  describe('> DoublyLinkedList', () => {
    let linkedList: DoublyLinkedList<{}>
    beforeEach(() => {
      linkedList = new DoublyLinkedList()
    })

    it('> expect size === 0', () => {
      expect(
        linkedList.size()
      ).toEqual(0)
    })

    describe('> insert into empty linked list', () => {
      const first = {}
      beforeEach(() => {
        linkedList.insertAfter(
          first,
          () => true
        )
      })
      it('> first === inserted element', () => {
        expect(
          linkedList.first.thisObj
        ).toBe(first)
      })
      it('> last === inserted element', () => {
        expect(
          linkedList.last.thisObj
        ).toBe(first)
      })
      it('> expect size === 1', () => {
        expect(
          linkedList.size()
        ).toEqual(1)
      })

      describe('> inserting same item', () => {
        beforeEach(() => {
          linkedList.insertAfter(
            first,
            () => true
          )
        })
        it('> second insertion will not be counted', () => {
          expect(
            linkedList.size()
          ).toEqual(1)
        })

        it('> next will be null', () => {
          expect(
            linkedList.first.next
          ).toBeFalsy()
        })
      })
    })

    describe('> insert into occupied linked list', () => {
      const obj1 = {
        name: 'obj1'
      }
      const obj2 = {
        name: 'obj2'
      }
      const obj3 = {
        name: 'obj3'
      }
      const predicateSpy = jasmine.createSpy('predicate')
      beforeEach(() => {
        linkedList.insertAfter(
          obj1,
          linkedItem => !linkedItem.next
        )
        linkedList.insertAfter(
          obj2,
          linkedItem => !linkedItem.next
        )
      })

      afterEach(() => {
        predicateSpy.calls.reset()
      })

      it('> adding obj calls predicateSpy', () => {
        predicateSpy.and.returnValue(true)
        linkedList.insertAfter(
          obj3,
          predicateSpy
        )
        expect(predicateSpy).toHaveBeenCalled()
      })

      describe('> inserts are the right positions', () => {
        describe('> predicate returns false', () => {
          beforeEach(() => {
            predicateSpy.and.returnValue(false)
            linkedList.insertAfter(
              obj3,
              predicateSpy
            )
          })
          it('> inserts at first position', () => {
            expect(
              linkedList.first.thisObj
            ).toBe(obj3)
          })

          it('> first.prev is falsy', () => {
            expect(
              linkedList.first.prev
            ).toBeFalsy()
          })

          it('> first.next.thisObj to be obj1', () => {
            expect(
              linkedList.first.next.thisObj
            ).toBe(obj1)
          })
        })
        describe('> predicate returns true for obj1', () => {
          beforeEach(() => {
            predicateSpy.and.callFake(function(){
              return arguments[0].thisObj === obj1
            })
            linkedList.insertAfter(
              obj3,
              predicateSpy
            )
          })

          it('> first.next is obj3', () => {
            expect(
              linkedList.first.next.thisObj
            ).toBe(obj3)
          })

          it('> last.prev is obj3', () => {
            expect(
              linkedList.last.prev.thisObj
            ).toBe(obj3)
          })

        })
        describe('> predicate returns true for obj2', () => {
          beforeEach(() => {
            predicateSpy.and.callFake(function(){
              return arguments[0].thisObj === obj2
            })
            linkedList.insertAfter(
              obj3,
              predicateSpy
            )
          })

          it('> inserts at last', () => {
            expect(
              linkedList.last.thisObj
            ).toBe(obj3)
          })

          it('> last.next is empty', () => {
            expect(
              linkedList.last.next
            ).toBeFalsy()
          })

          it('> last.prev to be obj2', () => {
            expect(
              linkedList.last.prev.thisObj
            ).toBe(obj2)
          })
        })
      })
    })
  })

  describe('> FindInLinkedList', () => {

  })
})
