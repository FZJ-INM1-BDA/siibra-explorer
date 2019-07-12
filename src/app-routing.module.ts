import {PreloadAllModules, RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {AtlasViewer} from "src/atlasViewer/atlasViewer.component";
// import {HelpPageComponent} from "src/helpPage/helpPage.component";

const appRoutes: Routes = [
    {
        path: '',
        loadChildren: () => import('./atlasViewer/atlasViewer.module').then(mod => mod.AtlasViewerModule),
        pathMatch: 'full'
    },

    { path: '', component: AtlasViewer, pathMatch: 'full'},
    // { path: 'help', component: HelpPageComponent},
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
