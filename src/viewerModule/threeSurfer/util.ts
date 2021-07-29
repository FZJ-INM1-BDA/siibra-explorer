export interface IContext {
  [key: string]: string
}

export function parseContext(input: string, contexts: IContext[]){
  let output = input
  for (const context of contexts) {
    for (const key in context) {
      const re = new RegExp(`${key}:`, 'g')
      output = output.replace(re, context[key])
    }
  }
  return output
}
