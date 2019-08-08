import { PipeTransform, Pipe } from "@angular/core";

@Pipe({
  name: 'menuIconPluginBtnClsPipe'
})

export class MenuIconPluginBtnClsPipe implements PipeTransform{
  public transform([launchedSet, minimisedSet, themedBtnCls], pluginName){
    return `${launchedSet.has(pluginName) 
      ? minimisedSet.has(pluginName)
        ? themedBtnCls + ' border-primary'
        : 'btn-primary' 
      : themedBtnCls}`
  }
}