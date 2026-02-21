import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VidsrcService {
  private readonly base = 'https://vidsrc-embed.ru/embed/movie/';

  private readonly baseTv = 'https://vidsrc-embed.ru/embed/tv/';

  getEmbedUrlByImdb(imdbId: string | undefined | null): string | null {
    if (!imdbId) return null;
    // ensure it starts with "tt"
    return this.base + (imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`);
  }

  /**
   * Return an embed URL using the TMDB numeric id.
   * Example: https://vidsrc-embed.ru/embed/movie/5433140
   */
  getEmbedUrlByTmdb(tmdbId: number | undefined | null): string | null {
    if (!tmdbId && tmdbId !== 0) return null;
    return this.base + String(tmdbId);
  }

  /**
   * Return an embed URL for TV shows using the TMDB id. Uses a default season/episode of 1-1.
   * Example: https://vidsrc-embed.ru/embed/tv/1399/1-1
   */
  getEmbedUrlByTmdbTv(tmdbId: number | undefined | null, season = 1, episode = 1): string | null {
    if (!tmdbId && tmdbId !== 0) return null;
    return `${this.baseTv}${tmdbId}/${season}-${episode}`;
  }
}