import { NgModule } from "@angular/core";
import { WidgetUnit } from "./widgetUnit/widgetUnit.component";
import { WidgetServices } from "./widgetService.service";
import { AngularMaterialModule } from "src/sharedModules";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "src/components";
import { ACTION_TO_WIDGET_TOKEN, TypeActionToWidget, EnumActionToWidget } from "./constants";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { getRandomHex } from 'common/util'

function openWidgetfactory(dialog: MatDialog): TypeActionToWidget<unknown>{

  const bsIdMap = new Map<string, { onCloseCb: () => void}>()
  const matRefSet = new Set<MatDialogRef<any>>()
  return (type, tmpl: any, option) => {
    switch (type) {
    case EnumActionToWidget.CLOSE: {
      const { id } = option
      if (!id) throw new Error(`Closing widget requires an id defined`)
      const obj = bsIdMap.get(id)
      if (!obj) throw new Error(`Widget id ${id} does not exist. Has it been closed already?`)

      return null
    }
    case EnumActionToWidget.OPEN: {
      if (!tmpl) throw new Error(`Opening widget requires tmplate defined!`)

      let id
      do {
        id = getRandomHex()
      } while(bsIdMap.has(id))

      const { onClose, data, overrideMatDialogConfig = {} } = option

      const matRef = dialog.open(tmpl, {
        hasBackdrop: false,
        disableClose: true,
        autoFocus: false,
        panelClass: 'mat-card-sm',
        height: '50vh',
        width: '350px',
        position: {
          left: '5px'
        },
        ...overrideMatDialogConfig,
        data
      })

      matRefSet.add(matRef)

      const onCloseCb = () => {
        bsIdMap.delete(id)
        matRef.close()
        matRefSet.delete(matRef)
        if (onClose) onClose()
      }
      bsIdMap.set(id, { onCloseCb })

      matRef.afterClosed().subscribe(onCloseCb)
      return { id, matDialogRef: matRef }
    }
    default: return null
    }
  }
}

@NgModule({
  imports:[
    AngularMaterialModule,
    CommonModule,
    ComponentsModule,
  ],
  declarations: [
    WidgetUnit
  ],
  entryComponents: [
    WidgetUnit
  ],
  providers: [
    WidgetServices,
    {
      provide: ACTION_TO_WIDGET_TOKEN,
      useFactory: openWidgetfactory,
      deps: [ MatDialog ]
    }
  ],
  exports: [
    WidgetUnit
  ]
})

export class WidgetModule{}
