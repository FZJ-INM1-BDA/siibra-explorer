import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "isLocalBlob",
  pure: true
})

export class IsLocalBlob implements PipeTransform {
  public transform(source: string|Record<string, unknown>) {
    if (typeof source === "string") {
      return source.startsWith("nifti://blob:http")
    }
    if (typeof source.url === "string") {
      return source.url.startsWith("nifti://blob:http")
    }
    return false
  }
}
