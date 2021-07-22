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


export type TOverwriteShowDatasetDialog = (dataset: { fullId: string } | { name: string, description: string }, arg?: any) => void

export const OVERWRITE_SHOW_DATASET_DIALOG_TOKEN = new InjectionToken<TOverwriteShowDatasetDialog>('OVERWRITE_SHOW_DATASET_DIALOG_TOKEN')

export type TRegionOfInterest = { ['fullId']: string }

export const REGION_OF_INTEREST = new InjectionToken<Observable<TRegionOfInterest>>('RegionOfInterest')
