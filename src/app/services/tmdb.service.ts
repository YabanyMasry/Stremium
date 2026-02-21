import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TmdbTopRatedResponse {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovie {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids?: number[];
  id: number;
  original_language: string;
  original_title?: string;
  overview: string;
  popularity?: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video?: boolean;
  vote_average: number;
  vote_count: number;
}

/** Details returned by /movie/{id} */
export interface TmdbMovieDetails extends TmdbMovie {
  imdb_id?: string | null;
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  homepage?: string | null;
  revenue?: number;
  budget?: number;
}

export interface TmdbTv {
  backdrop_path: string | null;
  genre_ids?: number[];
  id: number;
  original_language: string;
  name: string;
  overview: string;
  popularity?: number;
  poster_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
}

export interface TmdbTopRatedTvResponse {
  page: number;
  results: TmdbTv[];
  total_pages: number;
  total_results: number;
}

export interface TmdbTvDetails extends TmdbTv {
  homepage?: string | null;
  genres?: { id: number; name: string }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  seasons?: {
    air_date?: string;
    episode_count?: number;
    id?: number;
    name?: string;
    overview?: string;
    poster_path?: string | null;
    season_number?: number;
    vote_average?: number;
  }[];
}

export interface TmdbEpisode {
  air_date?: string;
  episode_number: number;
  id: number;
  name: string;
  overview: string;
  runtime?: number | null;
  season_number: number;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
}

export interface TmdbSeasonDetails {
  _id?: string;
  air_date?: string;
  episodes?: TmdbEpisode[];
  name?: string;
  overview?: string;
  id?: number;
  poster_path?: string | null;
  season_number?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private readonly base = 'https://api.themoviedb.org/3';
  private readonly url = `${this.base}/movie/top_rated?language=en-US&page=1`;
  private readonly headers = new HttpHeaders({
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxMjJmYzc1OGZmMWIxMmUyOThmMWMwODgwYjVlOTdhMyIsIm5iZiI6MTc3MTEwMTUyOS4wNzQsInN1YiI6IjY5OTBkZDU5YjQzZDg0ZWI4MjFhZTk3ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.6EWzDRl7ZBQ0A3djssW1u7ggfO-9vSCK4qcY9cxU62s'
  });

  constructor(private readonly http: HttpClient) {}

  getTopRatedMovies(): Observable<TmdbTopRatedResponse> {
    return this.http.get<TmdbTopRatedResponse>(this.url, { headers: this.headers });
  }

  getTopRatedTvShows(): Observable<TmdbTopRatedTvResponse> {
    const url = `${this.base}/tv/top_rated?language=en-US&page=1`;
    return this.http.get<TmdbTopRatedTvResponse>(url, { headers: this.headers });
  }

  searchMulti(query: string): Observable<any> {
    const q = encodeURIComponent(query);
    const url = `${this.base}/search/multi?query=${q}&include_adult=true&language=en-US&page=1`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  getSeasonDetails(seriesId: number, seasonNumber: number): Observable<TmdbSeasonDetails> {
    const url = `${this.base}/tv/${seriesId}/season/${seasonNumber}?language=en-US`;
    return this.http.get<TmdbSeasonDetails>(url, { headers: this.headers });
  }

  getPopularMovies(): Observable<TmdbTopRatedResponse> {
    const url = `${this.base}/movie/popular?language=en-US&page=1`;
    return this.http.get<TmdbTopRatedResponse>(url, { headers: this.headers });
  }

  getMovieDetails(tmdbId: number): Observable<TmdbMovieDetails> {
    const url = `${this.base}/movie/${tmdbId}?language=en-US`;
    return this.http.get<TmdbMovieDetails>(url, { headers: this.headers });
  }

  getTvDetails(tvId: number): Observable<TmdbTvDetails> {
    const url = `${this.base}/tv/${tvId}?language=en-US`;
    return this.http.get<TmdbTvDetails>(url, { headers: this.headers });
  }
}
