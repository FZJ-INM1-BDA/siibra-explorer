import { TemplateRef } from "@angular/core";

export interface IFileInputConfig {
  title: string
  allowText: boolean|string
  allowFile: boolean|string
  allowFileExt: string
  allowUrl: boolean|string
  messageTmpl?: TemplateRef<any>
}

export type TFileInput = {
  text: { input: string }
  file: { files: File[] }
  url: { url: string }
}

export type TFileInputEvent<Evt extends keyof TFileInput> = {
  type: Evt
  payload: TFileInput[Evt]
}