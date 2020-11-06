/**
 * Only the most common interfaces should reside here
 */

import { InjectionToken } from "@angular/core"

export interface IHasId{
  ['@id']: string
}


export type TOverwriteShowDatasetDialog = (dataset: { fullId: string } | { name: string, description: string }) => void

export const OVERWRITE_SHOW_DATASET_DIALOG_TOKEN = new InjectionToken<TOverwriteShowDatasetDialog>('OVERWRITE_SHOW_DATASET_DIALOG_TOKEN')
