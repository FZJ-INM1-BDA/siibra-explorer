import { TemplateRef } from "@angular/core";

export interface IFileInputConfig {
  title: string
  allowText: boolean
  allowFile: boolean
  messageTmpl?: TemplateRef<any>
}

export type TFileInput = {
  text: { input: string }
  file: { files: File[] }
}

export type TFileInputEvent<Evt extends keyof TFileInput> = {
  type: Evt
  payload: TFileInput[Evt]
}