import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'currParcSupportsTmpl',
  pure: true
})

export class CurrParcSupportsTmplPipe implements PipeTransform{
  public transform(parc: any, tmpl: any){
    /**
     * TODO
     * buggy. says julich brain v290 is not supported in fsaverage
     * related to https://github.com/FZJ-INM1-BDA/siibra-python/issues/98 
     */
    const parcSupportTmpl = (p: any) => !!(tmpl.availableIn || []).find(tmplP => tmplP['@id'] === p && p['@id'])
    return Array.isArray(parc)
      ? parc.some(parcSupportTmpl)
      : parcSupportTmpl(parc)
  }
}
