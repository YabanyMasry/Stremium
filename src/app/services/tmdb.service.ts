import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private readonly proxyBase = '/api/tmdb';

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

  /** Build a proxy URL: /api/tmdb?path=/...&key=value */
  private proxyUrl(path: string, params: Record<string, string | number> = {}): string {
    const qs = new URLSearchParams({ path, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    return `${this.proxyBase}?${qs.toString()}`;
  }

  getTopRatedMovies(page: number = 1): Observable<TmdbTopRatedResponse> {
    return this.http.get<TmdbTopRatedResponse>(this.proxyUrl('/movie/top_rated', { language: 'en-US', page }));
  }

  getTopRatedTvShows(page: number = 1): Observable<TmdbTopRatedTvResponse> {
    return this.http.get<TmdbTopRatedTvResponse>(this.proxyUrl('/tv/top_rated', { language: 'en-US', page }));
  }

  searchMulti(query: string, page: number = 1): Observable<any> {
    return this.http.get<any>(this.proxyUrl('/search/multi', { query, include_adult: 'true', language: 'en-US', page }));
  }

  getSeasonDetails(seriesId: number, seasonNumber: number): Observable<TmdbSeasonDetails> {
    return this.http.get<TmdbSeasonDetails>(this.proxyUrl(`/tv/${seriesId}/season/${seasonNumber}`, { language: 'en-US' }));
  }

  getPopularMovies(page: number = 1): Observable<TmdbTopRatedResponse> {
    return this.http.get<TmdbTopRatedResponse>(this.proxyUrl('/movie/popular', { language: 'en-US', page }));
  }

  getPopularTvShows(page: number = 1): Observable<TmdbTopRatedTvResponse> {
    return this.http.get<TmdbTopRatedTvResponse>(this.proxyUrl('/tv/popular', { language: 'en-US', page }));
  }

  getMovieDetails(tmdbId: number): Observable<TmdbMovieDetails> {
    return this.http.get<TmdbMovieDetails>(this.proxyUrl(`/movie/${tmdbId}`, { language: 'en-US' }));
  }

  getMovieImages(tmdbId: number): Observable<any> {
    return this.http.get<any>(this.proxyUrl(`/movie/${tmdbId}/images`, { include_image_language: 'en-US' }));
  }

  getTvDetails(tvId: number): Observable<TmdbTvDetails> {
    return this.http.get<TmdbTvDetails>(this.proxyUrl(`/tv/${tvId}`, { language: 'en-US' }));
  }

  getTvImages(tvId: number): Observable<any> {
    return this.http.get<any>(this.proxyUrl(`/tv/${tvId}/images`, { include_image_language: 'en-US' }));
  }

  // ── Genre lists ──

  getMovieGenres(): Observable<{ genres: { id: number; name: string }[] }> {
    return this.http.get<{ genres: { id: number; name: string }[] }>(this.proxyUrl('/genre/movie/list', { language: 'en-US' }));
  }

  getTvGenres(): Observable<{ genres: { id: number; name: string }[] }> {
    return this.http.get<{ genres: { id: number; name: string }[] }>(this.proxyUrl('/genre/tv/list', { language: 'en-US' }));
  }

  // ── Discover by genre ──

  discoverMoviesByGenre(genreId: number, page = 1): Observable<TmdbTopRatedResponse> {
    return this.http.get<TmdbTopRatedResponse>(this.proxyUrl('/discover/movie', {
      language: 'en-US', sort_by: 'vote_average.desc', with_genres: genreId, 'vote_count.gte': 50, page,
    }));
  }

  discoverTvByGenre(genreId: number, page = 1): Observable<TmdbTopRatedTvResponse> {
    return this.http.get<TmdbTopRatedTvResponse>(this.proxyUrl('/discover/tv', {
      language: 'en-US', sort_by: 'vote_average.desc', with_genres: genreId, 'vote_count.gte': 50, page,
    }));
  }
}
