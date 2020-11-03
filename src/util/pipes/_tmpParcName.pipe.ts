import { Pipe, PipeTransform } from "@angular/core";

/**
 * this is a temporary pipe class that transform 
 * JuBrain -> Julich-Brain 
 * in prod version of IAV
 */

@Pipe({
  name: 'tmpParcNamePipe'
})

export class TmpParcNamePipe implements PipeTransform{
  public transform(input: string): string{
    return input.replace(/JuBrain/gi, 'Julich-Brain')
  }
}