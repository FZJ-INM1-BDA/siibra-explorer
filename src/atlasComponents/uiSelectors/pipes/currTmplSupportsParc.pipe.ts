import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'currentTemplateSupportsParcellation',
  pure: true
})

export class CurrentTmplSupportsParcPipe implements PipeTransform{
  public transform(tmpl: any, parc: any): boolean {
    const testParc = (p: any) => !!(p?.availableIn || []).find((availTmpl: any) => availTmpl['@id'] === tmpl['@id'])
    return Array.isArray(parc)
      ? parc.some(testParc)
      : testParc(parc)
  }
}
