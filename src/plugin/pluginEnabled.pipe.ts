import { Pipe, PipeTransform } from "@angular/core";
import { PluginManifest } from "./types";
import { SxplrAtlas, SxplrParcellation, SxplrTemplate } from "src/atlasComponents/sapi/sxplrTypes";

@Pipe({
  name: 'pluginDisabledReasons',
  pure: true
})

export class PluginDisabledReasons implements PipeTransform {
  public transform(plugin: PluginManifest, atlas: SxplrAtlas, template: SxplrTemplate, parcellation: SxplrParcellation) {
    const reasons: string[] = []
    if (!(plugin.parcellations.allow || []).includes(parcellation.id)) {
      reasons.push(`Parcellation ${parcellation.name} not in the plugin's allow list.`)
    }
    if (!(plugin.spaces.allow || []).includes(template.id)) {
      reasons.push(`Space ${template.name} not in the plugin's allow list.`)
    }
    return reasons
  }
}
