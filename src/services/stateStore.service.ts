import { Action } from '@ngrx/store'

export const CHANGE_STATE = 'CHANGE_STATE'

export interface StateInterface{
  templateSelected : any
}

export function changeState(state:StateInterface,action:Action){
  switch(action.type){
    case CHANGE_STATE : {
      return Object.assign({},state)
    }
    default :
      return state
  }
}