type TRegDeregConfig = {
  first?: boolean
}

/**
 * this is base register/dregister class
 * a pattern which is observed very frequently
 */
export class RegDereg<T, Y = void> {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(){}
  public allowDuplicate = false
  protected callbacks: ((allArg: T) => Y)[] = []
  register(fn: (allArg: T) => Y, config?: TRegDeregConfig) {
    if (!this.allowDuplicate) {
      if (this.callbacks.indexOf(fn) >= 0) {
        console.warn(`[RegDereg] #register: function has already been regsitered`)
        return
      }
    }
    if (config?.first) {
      this.callbacks.unshift(fn)
    } else {
      this.callbacks.push(fn)
    }
  }
  deregister(fn: (allArg: T) => Y){
    this.callbacks = this.callbacks.filter(f => f !== fn )
  }
}

export class RegDeregController<T, Y = void> extends RegDereg<T, Y>{
  constructor(){
    super()
  }
  /**
   * Can be overwritten by inherited class
   */
  callRegFns(arg: T) {
    for (const fn of this.callbacks) {
      fn(arg)
    }
  }
}
