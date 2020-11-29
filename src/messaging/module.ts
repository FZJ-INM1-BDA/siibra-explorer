import { NgModule, Optional } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { AtlasViewerAPIServices } from "src/atlasViewer/atlasViewer.apiService.service";
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
    private dialog: MatDialog,
    @Optional() private apiService: AtlasViewerAPIServices
  ){

    window.addEventListener('message', async ({ data, origin, source }) => {
      const { method, id, param } = data
      const src = source as Window
      if (!method) return
      if (method.indexOf(IAV_POSTMESSAGE_NAMESPACE) !== 0) return
      const strippedMethod = method.replace(IAV_POSTMESSAGE_NAMESPACE, '')

      /**
       * if ping method, respond pong method
       */
      if (strippedMethod === 'ping') {
        window.opener.postMessage({
          id,
          result: 'pong',
          jsonrpc: '2.0'
        }, origin)
        return
      }

      /**
       * otherwise, check permission
       */

      try {
        const allow = await this.checkOrigin({ origin })
        if (!allow) {
          src.postMessage({
            jsonrpc: '2.0',
            id,
            error: {
              code: 403,
              message: 'User declined'
            }
          }, origin)
          return
        }
        const result = await this.processMessage({ method: strippedMethod, param })

        src.postMessage({
          jsonrpc: '2.0',
          id,
          result
        }, origin)

      } catch (e) {

        src.postMessage({
          jsonrpc: '2.0',
          id,
          error: e.code
            ? e
            : { code: 500, message: e.toString() }
        }, origin)
      }

    })
  }

  async processMessage({ method, param }){
    console.log({ method, param })

    if (method === 'dummyMethod') {
      return 'OK'
    }

    if (method === 'viewerHandle:add3DLandmarks') {
      this.apiService.interactiveViewer.viewerHandle.add3DLandmarks(param)
      return 'OK'
    }

    if (method === 'viewerHandle:remove3DLandmarks') {
      this.apiService.interactiveViewer.viewerHandle.remove3DLandmarks(param)
      return 'OK'
    }

    throw ({ code: 404, message: 'Method not found' })
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
}