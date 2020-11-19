import { NgModule } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ComponentsModule } from "src/components";
import { ConfirmDialogComponent } from "src/components/confirmDialog/confirmDialog.component";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";

const IAV_POSTMESSAGE_NAMESPACE = `ebrains:iav:`

@NgModule({
  imports: [
    AngularMaterialModule,
    ComponentsModule,
  ]
})

export class MesssagingModule{

  private whiteListedOrigins = new Set()
  private pendingRequests: Map<string, Promise<boolean>> = new Map()

  constructor(
    private dialog: MatDialog
  ){

    window.addEventListener('message', async ({ data, origin, source }) => {
      const { method, id } = data
      const src = source as Window
      if (!method) return
      if (method.indexOf(IAV_POSTMESSAGE_NAMESPACE) !== 0) return
      const strippedMethod = method.replace(IAV_POSTMESSAGE_NAMESPACE, '')
      switch (strippedMethod) {
      case 'ping': {
        window.opener.postMessage({
          id,
          result: 'pong',
          jsonrpc: '2.0'
        }, origin)

        break
      }
      case 'dummyMethod': {
        try {
          const result = await this.dummyMethod({ data, origin })
          src.postMessage({
            id,
            result
          }, origin)
        } catch (e) {

          src.postMessage({
            id,
            error: e.code
              ? e
              : { code: 500, message: e.toString() }
          }, origin)
        }
            
        break;
      }
      default: {
        src.postMessage({
          id,
          error: {
            code: 404,
            message: 'Method not found'
          }
        }, origin)
      }
      }
    })
  }

  async checkOrigin({ origin }){
    if (this.whiteListedOrigins.has(origin)) return true
    if (this.pendingRequests.has(origin)) return this.pendingRequests.get(origin)
    const responsePromise = this.dialog.open(
      ConfirmDialogComponent,
      {
        data: {
          title: `Cross tab messaging`,
          message: `${origin} would like to send data to interactive atlas viewer`,
          okBtnText: `Allow`
        }
      }
    ).afterClosed().toPromise()
    this.pendingRequests.set(origin, responsePromise)
    const response = await responsePromise
    this.pendingRequests.delete(origin)
    if (response) this.whiteListedOrigins.add(origin)
    return response
  }

  async dummyMethod({ data, origin }){
    const allow = await this.checkOrigin({ origin })
    if (!allow) throw ({ code: 403, message: 'User declined' })
    return 'OK'
  }
}