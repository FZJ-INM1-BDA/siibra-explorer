/**
 * Only the most common interfaces should reside here
 */

import { InjectionToken } from "@angular/core"
import { Observable } from "rxjs"

export interface IHasId{
  ['@id']: string
}

export interface IHasFullId{
  ['fullId']: string
}


export type TOverwriteShowDatasetDialog = (arg: any) => void

export type TRegionOfInterest = { ['fullId']: string }

export const CANCELLABLE_DIALOG = new InjectionToken('CANCELLABLE_DIALOG')

export type TTemplateImage = {
  name: string
  '@id': string
  ngId: string
  visible: boolean
}
