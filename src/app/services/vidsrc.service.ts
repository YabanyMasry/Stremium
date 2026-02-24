import { Injectable } from '@angular/core';

/**
 * CineSrc embed service (https://cinesrc.st/docs)
 *
 * Customization params (append as query string):
 *   seek        – seek-button duration 1-99s (default 10)
 *   autoplay    – auto-start playback (default true)
 *   muted       – start muted (default false)
 *   color       – accent hex colour, use %23 for # (e.g. %23e50914)
 *   controls    – show player controls (default true)
 *   back        – URL for back button, or "close" to postMessage parent
 *   autonext    – auto-play next episode on end (default true)
 *   autoskip    – auto-skip intro/recap (default false)
 *   prioritize  – use last-used server on load (default false)
 *   lastserver  – preferred server ID
 *   t / time    – start time in seconds
 *
 * PostMessage events from player (origin https://cinesrc.st):
 *   cinesrc:ready, cinesrc:play, cinesrc:pause,
 *   cinesrc:timeupdate { currentTime, duration },
 *   cinesrc:ended, cinesrc:volumechange { volume, muted },
 *   cinesrc:nextepisode { season, episode },
 *   cinesrc:close, cinesrc:error { error }
 *
 * PostMessage commands to player:
 *   play(), pause(), seek(time), setVolume(0-1),
 *   setMuted(bool), setPlaybackRate(0.25-2)
 */
@Injectable({
  providedIn: 'root'
})
export class VidsrcService {
  private readonly baseMovie = 'https://cinesrc.st/embed/movie/';
  private readonly baseTv    = 'https://cinesrc.st/embed/tv/';

  /** Default query params appended to every embed URL */
  private readonly defaults: Record<string, string> = {
    autoplay: 'false',
    autonext: 'true',
  };

  getEmbedUrlByImdb(imdbId: string | undefined | null): string | null {
    // cinesrc uses TMDB ids; kept for backward compat – callers should migrate
    return null;
  }

  /**
   * Movie embed: https://cinesrc.st/embed/movie/{tmdb_id}
   */
  getEmbedUrlByTmdb(tmdbId: number | undefined | null, extra?: Record<string, string>): string | null {
    if (!tmdbId && tmdbId !== 0) return null;
    return this.baseMovie + String(tmdbId) + this.buildQuery(extra);
  }

  /**
   * TV embed: https://cinesrc.st/embed/tv/{tmdb_id}?s={season}&e={episode}
   */
  getEmbedUrlByTmdbTv(tmdbId: number | undefined | null, season = 1, episode = 1, extra?: Record<string, string>): string | null {
    if (!tmdbId && tmdbId !== 0) return null;
    const params = { s: String(season), e: String(episode), ...extra };
    return this.baseTv + String(tmdbId) + this.buildQuery(params);
  }

  private buildQuery(extra?: Record<string, string>): string {
    const merged = { ...this.defaults, ...(extra || {}) };
    const parts = Object.entries(merged).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return parts.length ? '?' + parts.join('&') : '';
  }
}