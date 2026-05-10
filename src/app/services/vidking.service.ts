import { Injectable } from '@angular/core';

/**
 * Vidking embed service (https://www.vidking.net)
 *
 * URL formats:
 *   Movie: https://www.vidking.net/embed/movie/{tmdbId}
 *   TV:    https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}
 *
 * Query params:
 *   color           – primary hex color (no '#'), default e50914
 *   autoPlay        – boolean, default false
 *   nextEpisode     – boolean, TV only, default true
 *   episodeSelector – boolean, TV only, default true
 *   progress        – start time in seconds
 *
 * PostMessage events from player (origin https://www.vidking.net):
 *   { type: 'PLAYER_EVENT', data: {
 *       event: 'timeupdate'|'play'|'pause'|'ended'|'seeked',
 *       currentTime, duration, progress,
 *       id, mediaType, season, episode, timestamp
 *   }}
 */
@Injectable({ providedIn: 'root' })
export class VidkingService {
  private readonly baseMovie = 'https://www.vidking.net/embed/movie/';
  private readonly baseTv    = 'https://www.vidking.net/embed/tv/';

  /** Default query params appended to every embed URL */
  private readonly defaults: Record<string, string> = {
    color: 'e50914',
    autoPlay: 'false',
  };

  private readonly tvDefaults: Record<string, string> = {
    nextEpisode: 'true',
    episodeSelector: 'true',
  };

  /** Movie embed: https://www.vidking.net/embed/movie/{tmdb_id} */
  getEmbedUrlByTmdb(tmdbId: number | undefined | null, extra?: Record<string, string>): string | null {
    if (!tmdbId && tmdbId !== 0) return null;
    return this.baseMovie + String(tmdbId) + this.buildQuery(this.defaults, extra);
  }

  /** TV embed: https://www.vidking.net/embed/tv/{tmdb_id}/{season}/{episode} */
  getEmbedUrlByTmdbTv(
    tmdbId: number | undefined | null,
    season = 1,
    episode = 1,
    extra?: Record<string, string>,
  ): string | null {
    if (!tmdbId && tmdbId !== 0) return null;
    return (
      this.baseTv +
      String(tmdbId) +
      '/' +
      String(season) +
      '/' +
      String(episode) +
      this.buildQuery(this.defaults, this.tvDefaults, extra)
    );
  }

  private buildQuery(...sources: Array<Record<string, string> | undefined>): string {
    const merged: Record<string, string> = {};
    for (const s of sources) if (s) Object.assign(merged, s);
    const parts = Object.entries(merged).map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    );
    return parts.length ? '?' + parts.join('&') : '';
  }
}
