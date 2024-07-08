// import { CommonModule } from "@angular/common";
// import { Component, Input, Output, inject } from "@angular/core";
// import { Store, select } from "@ngrx/store";
// import { BehaviorSubject, EMPTY, merge, of } from "rxjs";
// import { map, switchMap, withLatestFrom } from "rxjs/operators";
// import { PathReturn } from "src/atlasComponents/sapi/typeV3";
// import { AngularMaterialModule } from "src/sharedModules";
// import { atlasAppearance, atlasSelection } from "src/state";
// import { DestroyDirective } from "src/util/directives/destroy.directive";

// const CONNECTIVITY_LAYER_ID = "connectivity-colormap-id"

// type Intent = PathReturn<"/feature/{feature_id}/intents">['items'][number]

// @Component({
//   selector: 'atlas-colormap-intents',
//   templateUrl: './intents.template.html',
//   styleUrls: [
//     './intents.style.css'
//   ],
//   standalone: true,
//   imports: [
//     CommonModule,
//     AngularMaterialModule,
//   ],
//   hostDirectives: [
//     DestroyDirective
//   ]
// })
// export class AtlasColorMapIntents{

//   readonly #destory$ = inject(DestroyDirective).destroyed$
//   #intents$ = new BehaviorSubject<Intent[]>([])

//   @Input()
//   set intents(val: Intent[]){
//     this.#intents$.next(val)
//   }

//   @Output()
//   actions = merge(
//     merge(
//       this.#destory$,
//       this.#intents$
//     ).pipe(
//       map(() => atlasAppearance.actions.removeCustomLayer({
//         id: CONNECTIVITY_LAYER_ID
//       }))
//     ),
//     this.#intents$.pipe(
//       withLatestFrom(
//         this.store.pipe(
//           select(atlasSelection.selectors.selectedParcAllRegions)
//         )
//       ),
//       switchMap(([ intents, allRegions ]) => {
//         const foundCm = (intents || []).find(intent => intent['@type'].includes("intent/colorization"))
//         if (!foundCm) {
//           return EMPTY
//         }
        
//         const { region_mappings: regionMappings } = foundCm
//         const regRgbTuple = regionMappings
//           .map(({ region, rgb }) => {
//             const foundRegion = allRegions.find(r => r.name === region.name)
//             if (!foundRegion) {
//               return null
//             }
//             return [foundRegion, rgb] as const
//           })
//           .filter(v => !!v)

//         const newMap = new Map(regRgbTuple)
//         return of(
//           atlasAppearance.actions.addCustomLayer({
//             customLayer: {
//               clType: 'customlayer/colormap',
//               id: CONNECTIVITY_LAYER_ID,
//               colormap: newMap
//             }
//           })
//         )
//       })
//     )
//   )

//   constructor(private store: Store){ }
// }
