import { Routes } from '@angular/router';
import { MovieComponent } from './movie/movie';
import { ShowComponent } from './show/show';
import { Home } from './home/home';
import { MoviesPageComponent } from './movies/movies-page';
import { SeriesPageComponent } from './series/series-page';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'movies', component: MoviesPageComponent },
  { path: 'series', component: SeriesPageComponent },
  { path: 'movie/:id', component: MovieComponent },
  { path: 'show/:id', component: ShowComponent },
];
