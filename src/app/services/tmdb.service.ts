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

  /** Static TMDB genre-id → name map (movies + TV combined) */
  static readonly GENRE_MAP: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
    878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
  };

  static idsToGenres(ids?: number[]): string[] {
    return (ids || []).map((id) => TmdbService.GENRE_MAP[id]).filter(Boolean);
  }

  constructor(private readonly http: HttpClient) {}

  getTopRatedMovies(page: number = 1): Observable<TmdbTopRatedResponse> {
    const url = `${this.base}/movie/top_rated?language=en-US&page=${page}`;
    return this.http.get<TmdbTopRatedResponse>(url, { headers: this.headers });
  }

  getTopRatedTvShows(page: number = 1): Observable<TmdbTopRatedTvResponse> {
    const url = `${this.base}/tv/top_rated?language=en-US&page=${page}`;
    return this.http.get<TmdbTopRatedTvResponse>(url, { headers: this.headers });
  }

  searchMulti(query: string, page: number = 1): Observable<any> {
    const q = encodeURIComponent(query);
    const url = `${this.base}/search/multi?query=${q}&include_adult=true&language=en-US&page=${page}`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  getSeasonDetails(seriesId: number, seasonNumber: number): Observable<TmdbSeasonDetails> {
    const url = `${this.base}/tv/${seriesId}/season/${seasonNumber}?language=en-US`;
    return this.http.get<TmdbSeasonDetails>(url, { headers: this.headers });
  }

  getPopularMovies(page: number = 1): Observable<TmdbTopRatedResponse> {
    const url = `${this.base}/movie/popular?language=en-US&page=${page}`;
    return this.http.get<TmdbTopRatedResponse>(url, { headers: this.headers });
  }

  getPopularTvShows(page: number = 1): Observable<TmdbTopRatedTvResponse> {
    const url = `${this.base}/tv/popular?language=en-US&page=${page}`;
    return this.http.get<TmdbTopRatedTvResponse>(url, { headers: this.headers });
  }

  getMovieDetails(tmdbId: number): Observable<TmdbMovieDetails> {
    const url = `${this.base}/movie/${tmdbId}?language=en-US`;
    return this.http.get<TmdbMovieDetails>(url, { headers: this.headers });
  }

  getMovieImages(tmdbId: number): Observable<any> {
    const url = `${this.base}/movie/${tmdbId}/images?include_image_language=en-US`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  getTvDetails(tvId: number): Observable<TmdbTvDetails> {
    const url = `${this.base}/tv/${tvId}?language=en-US`;
    return this.http.get<TmdbTvDetails>(url, { headers: this.headers });
  }

  getTvImages(tvId: number): Observable<any> {
    const url = `${this.base}/tv/${tvId}/images?include_image_language=en-US`;
    return this.http.get<any>(url, { headers: this.headers });
  }

  // ── Genre lists ──

  getMovieGenres(): Observable<{ genres: { id: number; name: string }[] }> {
    const url = `${this.base}/genre/movie/list?language=en-US`;
    return this.http.get<{ genres: { id: number; name: string }[] }>(url, { headers: this.headers });
  }

  getTvGenres(): Observable<{ genres: { id: number; name: string }[] }> {
    const url = `${this.base}/genre/tv/list?language=en-US`;
    return this.http.get<{ genres: { id: number; name: string }[] }>(url, { headers: this.headers });
  }

  // ── Discover by genre ──

  discoverMoviesByGenre(genreId: number, page = 1): Observable<TmdbTopRatedResponse> {
    const url = `${this.base}/discover/movie?language=en-US&sort_by=vote_average.desc&with_genres=${genreId}&vote_count.gte=50&page=${page}`;
    return this.http.get<TmdbTopRatedResponse>(url, { headers: this.headers });
  }

  discoverTvByGenre(genreId: number, page = 1): Observable<TmdbTopRatedTvResponse> {
    const url = `${this.base}/discover/tv?language=en-US&sort_by=vote_average.desc&with_genres=${genreId}&vote_count.gte=50&page=${page}`;
    return this.http.get<TmdbTopRatedTvResponse>(url, { headers: this.headers });
  }
}
