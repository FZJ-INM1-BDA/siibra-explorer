
type IsParent<T> = (child: T, parent: T) => boolean

export class Tree<T extends object>{

  private _nodes: T[] = []
  protected set nodes(nodes: T[]) {
    if (nodes === this._nodes) return
    this._nodes = nodes
    this.resetWeakMaps()
  }
  protected get nodes() {
    return this._nodes
  }

  private _isParent: IsParent<T> = (c, p) => false
  protected set isParent(fn: IsParent<T>){
    if (fn === this._isParent) return
    this._isParent = fn
    this.resetWeakMaps()
  }
  protected get isParent(){
    return this._isParent
  }
  public someAncestor(node: T, predicate: (anc: T) => boolean) {
    const parent = this.getParent(node)
    if (!parent) {
      return false
    }
    if (predicate(parent)) {
      return true
    }
    return this.someAncestor(parent, predicate)
  }
  public getParent(node: T): T {
    if (!this.parentWeakMap.has(node)) {
      for (const parentNode of this.nodes) {
        if (this.isParent(node, parentNode)) {
          this.parentWeakMap.set(node, parentNode)
          break
        }
      }
    }
    return this.parentWeakMap.get(node)
  }
  public getChildren(node: T): T[] {
    if (!this.childrenWeakMap.has(node)) {
      const children = this.nodes.filter(childNode => this.isParent(childNode, node))
      this.childrenWeakMap.set(node, children)
      for (const c of children) {
        this.parentWeakMap.set(c, node)
      }
    }
    return this.childrenWeakMap.get(node)
  }
  public getLevel(node: T): number {
    let level = -1, cursor = node
    const maxLevel = 32
    do {
      if (level >= maxLevel) {
        level = 0
        break
      }
      level++
      cursor = this.getParent(cursor)
    } while (!!cursor)
    return level
  }
  protected childrenWeakMap = new WeakMap<T, T[]>()
  protected parentWeakMap = new WeakMap<T, T>()
  protected nodeAncestorIsLast = new WeakMap<T, boolean[]>()

  get rootNodes() {
    const root = this.nodes.filter(node => !this.getParent(node))
    for (const el of root) {
      this.parentWeakMap.set(el, null)
      this.nodeAncestorIsLast.set(el, [])
    }
    return root
  }

  constructor(
    _nodes: T[] = [],
    _isParent: IsParent<T> = (c, p) => false
  ){
    this._nodes = _nodes
    this._isParent = _isParent
  }

  private resetWeakMaps() {

    /**
     * on new nodes passed, reset all maps
     * otherwise, tree will show stale data and will not update
     */
    this.childrenWeakMap = new WeakMap()
    this.parentWeakMap = new WeakMap()
    this.nodeAncestorIsLast = new WeakMap()
  }
}
