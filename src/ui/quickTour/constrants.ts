import { InjectionToken, TemplateRef } from "@angular/core"

type TPosition = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left' | 'center'

type TCustomPosition = {
    left: number
    top: number
}

export interface IQuickTourData {
    order: number
    description: string
    descriptionMd?: string
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

export enum EnumQuickTourSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'hight',
}

export const PERMISSION_DIALOG_ACTIONS = {
  START: `start`,
  CANCEL: `cancel`,
  NOTNOW: `notnow`,
}