import {PreloadAllModules, RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {AtlasViewer} from "src/atlasViewer/atlasViewer.component";

const appRoutes: Routes = [
    { path: '', component: AtlasViewer, pathMatch: 'full'},
    {
        path: 'help',
        loadChildren: () => import('./helpPage/helpPage.module').then(mod => mod.HelpPageModule),
    },
    { path: '**', redirectTo: ''}
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {preloadingStrategy: PreloadAllModules}),
    ],
    exports: [
        RouterModule
    ],
})
export class AppRoutingModule {}
