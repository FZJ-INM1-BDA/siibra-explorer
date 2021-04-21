import { InjectionToken, TemplateRef } from "@angular/core"

type TPosition = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'

type TCustomPosition = {
    left: number
    top: number
}

export interface IQuickTourData {
    order: number
    description: string
    tourPosition?: TPosition
    overwritePosition?: IQuickTourOverwritePosition
    overwriteArrow?: TemplateRef<any> | string
}

export interface IQuickTourOverwritePosition {
    dialog: TCustomPosition
    arrow: TCustomPosition
}

export type TQuickTourPosition = TPosition

export const QUICK_TOUR_CMP_INJTKN = new InjectionToken('QUICK_TOUR_CMP_INJTKN')
