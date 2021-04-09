export interface IDoublyLinkedItem<T extends object> {
  next: IDoublyLinkedItem<T>
  prev: IDoublyLinkedItem<T>
  thisObj: T
  readonly index: number
  list: DoublyLinkedList<T>
}

export class DoublyLinkedList<T extends object>{
  
  public first: IDoublyLinkedItem<T>
  public last: IDoublyLinkedItem<T>
  private _map = new WeakMap<T, IDoublyLinkedItem<T>>()
  private _size: number = 0
  insertAfter(element: T, predicate: (cmpObj: T) => boolean){
    if (this._map.get(element)) {
      console.warn(`element has already been added to the doublylinkedlist`)
      return
    }

    const insertAfter = FindInLinkedList<T>(
      this,
      predicate
    )

    /**
     * if predicate can be found, then insert after the found entry
     * if not, then the previous first entry will be the next element
     */
    const newDoublyLinkedItemNext = insertAfter
      ? insertAfter.next
      : this.first

    const newDoublyLinkedItem: IDoublyLinkedItem<T> = {
      prev: insertAfter,
      next: newDoublyLinkedItemNext,
      thisObj: element,
      get index() {
        let count = 0, prev: IDoublyLinkedItem<T>
        prev = this.prev
        while (prev) {
          prev = prev.prev
          count ++
        }
        return count
      },
      list: this
    }

    /**
    * set next of prev item
    * if prev is null, set first as this doublyitem
    */
    if (insertAfter) insertAfter.next = newDoublyLinkedItem
    else this.first = newDoublyLinkedItem

    /**
    * set prev of next item
    * if next is null, set last as this doublyitem
    */
    if (newDoublyLinkedItemNext) newDoublyLinkedItemNext.prev = newDoublyLinkedItem
    else this.last = newDoublyLinkedItem
    
    this._map.set(element, newDoublyLinkedItem)
    this._size ++
  }
  remove(element: T) {
    const doublyLinkedItem = this._map.get(element)
    if (!doublyLinkedItem) {
      console.error(`doubly linked item not found`)
      return
    }
    const { next, prev } = doublyLinkedItem

    if (prev) prev.next = next
    if (next) next.prev = prev

    if (doublyLinkedItem === this.first) this.first = this.first.next
    if (doublyLinkedItem === this.last) this.last = this.last.prev

    // weakmap does not need to explicitly remove key/val
    // decrement the size
    this._size --
  }
  size(){
    return this._size
  }
}

export function FindInLinkedList<T extends object>(list: DoublyLinkedList<T>, predicate: (element: T) => boolean){
  let compareObj = list.first,
    returnObj: IDoublyLinkedItem<T> = null

  if (!compareObj) return null

  do {
    if (predicate(compareObj.thisObj)) {
      returnObj = compareObj
      break
    }
    compareObj = compareObj.next
  } while(!!compareObj)

  return returnObj
}
