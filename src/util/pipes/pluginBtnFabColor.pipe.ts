import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'pluginBtnFabColorPipe',
})

export class PluginBtnFabColorPipe implements PipeTransform {
  public transform([launchedSet, minimisedSet], pluginName) {
    return minimisedSet.has(pluginName)
      ? 'primary'
      : launchedSet.has(pluginName)
        ? 'accent'
        : 'basic'
  }
}
