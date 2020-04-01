export class PluginHandler {
  public onShutdown: (callback: () => void) => void
  public blink: (sec?: number) => void
  public shutdown: () => void

  public initState?: any
  public initStateUrl?: string

  public setInitManifestUrl: (url: string|null) => void

  public setProgressIndicator: (progress: number) => void
}
