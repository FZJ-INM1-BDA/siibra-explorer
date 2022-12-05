import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Inject, OnDestroy, Optional, ViewChild, ViewContainerRef } from "@angular/core";
import { combineLatest, fromEvent, interval, Subscription } from "rxjs";
import { map, scan, share, startWith, take, filter } from "rxjs/operators";
import { BoothVisitor, JRPCRequest, JRPCSuccessResp, ListenerChannel } from "src/api/jsonrpc";
import { ApiBoothEvents, ApiService, BroadCastingApiEvents, HeartbeatEvents, namespace } from "src/api/service";
import { getUuid } from "src/util/fn";
import { WIDGET_PORTAL_TOKEN } from "src/widget/constants";
import { getPluginSrc, SET_PLUGIN_NAME } from "../const";

/**
 * sandbox attribute must be set statically
 * see https://angular.io/errors/NG0910
 */

@Component({
  selector: 'sxplr-plugin-portal',
  template: `
  <iframe [src]="src | iframeSrc"
    sandbox="allow-downloads allow-popups allow-popups-to-escape-sandbox allow-scripts"
    #iframe>
  </iframe>
  `,
  styles: [
    `:host { width: 100%; height: 100%; display: block; } iframe { width: 100%; height: 100%; border: none; }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PluginPortal implements AfterViewInit, OnDestroy, ListenerChannel{

  @ViewChild('iframe', { read: ElementRef })
  iframeElRef: ElementRef
  src: string
  srcName: string
  private origin: string

  private onDestroyCb: (() => void)[] = []
  private sub: Subscription[] = []
  private handshakeSub: Subscription[] = []

  private boothVisitor: BoothVisitor<ApiBoothEvents>
  private childWindow: Window

  constructor(
    private apiService: ApiService,
    public vcr: ViewContainerRef,
    @Optional() @Inject(SET_PLUGIN_NAME) private setPluginName: (inst: unknown, pluginName: string) => void,
    @Optional() @Inject(WIDGET_PORTAL_TOKEN) portalData: Record<string, string>
  ){
    if (portalData){
      this.src = getPluginSrc(portalData)
      const url = new URL(this.src)
      this.origin = url.origin
    }
  }

  ngAfterViewInit(): void {
    if (this.iframeElRef) {
      const iframeWindow = (this.iframeElRef.nativeElement as HTMLIFrameElement).contentWindow
      const handShake$ = interval(1000).pipe(
        map(() => getUuid()),
        take(10),
        share()
      )
      this.handshakeSub.push(
        /**
         * handshake
         */
        handShake$.pipe(
          // try for 10 seconds. If nothing loads within 10 minutes, assuming dead.
        ).subscribe(id => {
          const handshakeMsg: JRPCRequest<string, null> = {
            jsonrpc: '2.0',
            id,
            method: `${namespace}.init`,
          }
          iframeWindow.postMessage(handshakeMsg, this.origin)
        }),

        combineLatest([
          handShake$.pipe(
            scan((acc, curr) => [...acc, curr], [])
          ),
          fromEvent<MessageEvent>(window, 'message').pipe(
            startWith(null as MessageEvent),
          )
        ]).subscribe(([ids, event]) => {
          const { id, jsonrpc } = event?.data || {}
          if (jsonrpc === "2.0" && ids.includes(id)) {
            const data = event.data as JRPCSuccessResp<HeartbeatEvents['init']['response']>

            this.srcName = data.result.name || 'Untitled Pluging'
            this.setPluginName(this, this.srcName)
            
            while (this.handshakeSub.length > 0) this.handshakeSub.pop().unsubscribe()

            /**
             * hook up to the listener for the plugin
             */
            this.childWindow = iframeWindow
            this.apiService.broadcastCh.addListener(this)
            this.boothVisitor = this.apiService.booth.handshake()
          }
        })
      )

      /**
       * listening to plugin requests
       * only start after boothVisitor is defined
       */
      const sub = fromEvent<MessageEvent>(window, 'message').pipe(
        startWith(null as MessageEvent),
        filter(msg => !!this.boothVisitor && msg.data.jsonrpc === "2.0" && !!msg.data.method && msg.origin === this.origin)
      ).subscribe(async msg => {
        try {
          if (msg.data.method === `${namespace}.exit`) {
            sub.unsubscribe()
          }
          const result = await this.boothVisitor.request(msg.data)
          if (!!result) {
            this.childWindow.postMessage(result, this.origin)
          }
        } catch (e) {
          this.childWindow.postMessage({
            id: msg.data.id,
            error: {
              code: -32603,
              message: e.toString()
            }
          }, this.origin)
        }
      })
    }
  }
  notify(payload: JRPCRequest<keyof BroadCastingApiEvents, BroadCastingApiEvents[keyof BroadCastingApiEvents]>) {
    if (this.childWindow) {
      this.childWindow.postMessage(payload, this.origin)
    }
  }
  registerLeaveCb(cb: () => void) {
    this.onDestroyCb.push(() => cb())
  }

  ngOnDestroy(): void {
    while (this.handshakeSub.length > 0) this.handshakeSub.pop().unsubscribe()
    while (this.sub.length > 0) this.sub.pop().unsubscribe()
    while (this.onDestroyCb.length > 0) this.onDestroyCb.pop()()
  }
}
