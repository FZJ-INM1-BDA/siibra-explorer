import { InjectionToken } from "@angular/core";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";

export enum EnumActionToWidget{
  OPEN,
  CLOSE,
}

export interface IActionWidgetOption{
  onClose?: () => void
  data?: any
  overrideMatDialogConfig?: Partial<MatDialogConfig>
  id?: string
}

interface TypeActionWidgetReturnVal<T>{
  id: string
  matDialogRef: MatDialogRef<T>
}

export type TypeActionToWidget<T> = (type: EnumActionToWidget, obj: T, option: IActionWidgetOption) => TypeActionWidgetReturnVal<T>

export const WIDGET_PORTAL_TOKEN = new InjectionToken<Record<string, unknown>>("WIDGET_PORTAL_TOKEN")

export const RM_WIDGET = new InjectionToken('RM_WIDGET')