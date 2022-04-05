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

