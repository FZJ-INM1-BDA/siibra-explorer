const { retry } = require('./util')

let val = 0

const prFn = () => {
  val++
  return val >=3 ? Promise.resolve() : Promise.reject()
} 

retry(() => prFn())