import { Routes } from '@angular/router';
import { MovieComponent } from './movie/movie';
import { ShowComponent } from './show/show';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'movie/:id', component: MovieComponent },
  { path: 'show/:id', component: ShowComponent },
];
