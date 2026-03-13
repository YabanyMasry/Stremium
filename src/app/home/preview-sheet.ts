import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { NgIf, SlicePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TmdbService, TmdbSeasonDetails, TmdbEpisode } from '../services/tmdb.service';
import { EpisodeControlsComponent } from '../show/episode-controls';

export interface PreviewPlayEvent {
  id: number;
  media_type: 'movie' | 'tv';
  season?: number | null;
  episode?: number | null;
}

@Component({
  standalone: true,
  selector: 'app-preview-sheet',
  imports: [NgIf, SlicePipe, EpisodeControlsComponent],
  template: `
    <div class="preview-overlay" [class.open]="open" (click)="onClose()"></div>
    <div class="preview-sheet" [class.open]="open" role="dialog" aria-modal="true" [attr.aria-hidden]="!open">
      <div class="preview-loader" *ngIf="loading">
        <img src="assets/Stream 1.png" alt="Loading" class="preview-loader-logo" />
      </div>
      <div class="preview-banner">
        <img *ngIf="data?.backdrop_path" class="banner-img" [src]="'https://image.tmdb.org/t/p/original' + data.backdrop_path" alt="backdrop" />
        <div class="banner-logo">
          <img *ngIf="data?.logo_path" [src]="'https://image.tmdb.org/t/p/w500' + data.logo_path" alt="logo" />
          <div class="banner-meta" *ngIf="data">
            <span *ngIf="data?.release_date" class="meta-pill">{{ data.release_date | slice:0:4 }}</span>
            <span *ngIf="data?.vote_average !== undefined" class="meta-pill">&#9733; {{ data.vote_average?.toFixed(1) }}</span>
            <span *ngIf="data?.genres?.length" class="meta-pill">{{ data.genres.join(', ') }}</span>
          </div>
        </div>
      </div>
      <div class="preview-body">
        <div class="preview-info">
          <div class="preview-actions">
            <button (click)="onPlay()">Play</button>
            <button (click)="onClose()">Close</button>
          </div>
          <div class="preview-overview">
            <p *ngIf="data?.overview">{{ data.overview }}</p>
          </div>

          <app-episode-controls
            *ngIf="data?.media_type === 'tv' && pvDisplayedSeasons.length > 0"
            [displayedSeasons]="pvDisplayedSeasons"
            [displayedEpisodes]="pvDisplayedEpisodes"
            [episodes]="pvEpisodes"
            [selectedSeason]="pvSelectedSeason"
            [selectedEpisodeNumber]="pvSelectedEpisodeNumber"
            [showAllSeasons]="pvShowAllSeasons"
            [showAllEpisodes]="pvShowAllEpisodes"
            [episodesToShow]="pvEpisodesToShow"
            [seasonsToShow]="pvSeasonsToShow"
            [allSeasonsLength]="pvAllSeasons.length"
            (seasonSelected)="pvSelectSeason($event)"
            (episodeSelected)="pvSelectEpisode($event)"
            (toggleLoadMoreSeasons)="pvToggleLoadMoreSeasons()"
            (toggleLoadMoreEpisodes)="pvToggleLoadMoreEpisodes()"
          ></app-episode-controls>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-overlay { position: fixed; inset: 0; background: #000000c2; opacity: 0; pointer-events: none; transition: opacity 360ms ease-out; z-index: 80; }
    .preview-overlay.open { opacity: 1; pointer-events: auto; }
    .preview-sheet {
      position: fixed; left: 20vw; right: 20vw; top: 8vh; bottom: 0; background: #030303; border-radius: 12px 12px 0 0;
      transform: translateY(100vh); opacity: 0; transition: transform 360ms cubic-bezier(.22,.9,.3,1), opacity 220ms ease;
      pointer-events: none; will-change: transform, opacity; z-index: 90; overflow-y: auto; color: #fff;
    }
    .preview-sheet.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
    .preview-banner { position: relative; width: 100%; height: auto; border-top-left-radius: 12px; border-top-right-radius: 12px; overflow: visible; background: #071018; display: block; }
    .preview-banner::after {
      content: ""; position: absolute; left: 0; right: 0; bottom: -10px; height: 45%; pointer-events: none; z-index: 1;
      background: linear-gradient(to top, #030303 0%, rgb(0,0,0) 15%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.18) 80%, rgba(0,0,0,0) 100%);
    }
    .banner-img { display: block; width: 100%; height: auto; object-fit: cover; object-position: center top; }
    .banner-logo {
      position: absolute; left: 1rem; bottom: 1rem; z-index: 2;
      width: 40%; max-width: 40%; max-height: 30vh;
      background: transparent; padding: 0; border-radius: 0;
      display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end;
      gap: 0.5rem; overflow: visible;
    }
    .banner-logo img { height: auto; max-height: 30vh; width: auto; max-width: 100%; display: block; }
    .banner-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
    .meta-pill {
      background: rgba(255,255,255,0.06); color: #fff;
      padding: 6px 10px; border-radius: 999px; font-size: 0.9rem;
      display: inline-flex; align-items: center; gap: 6px;
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow: 0 4px 12px rgba(0,0,0,0.45);
    }
    .preview-body { padding: 1rem 1.5rem 1.5rem; display: block; }
    .preview-info { margin-top: 8px; }
    .preview-actions { display: flex; gap: 8px; margin-bottom: 8px; }
    .preview-actions button {
      background: rgba(255,255,255,0.06); color: #fff;
      padding: 8px 12px; border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.04);
      box-shadow: 0 6px 18px rgba(0,0,0,0.45);
      backdrop-filter: blur(6px); cursor: pointer;
      font-weight: 600; font-size: 0.95rem;
      transition: transform 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;
    }
    .preview-actions button:first-child {
      background: linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
      color: rgba(255,255,255,0.9);
    }
    .preview-actions button:hover { background: rgba(255,255,255,0.12); }
    .preview-actions button:active { transform: translateY(0); }
    .preview-actions button:focus { outline: none; box-shadow: 0 0 0 4px rgba(255,255,255,0.04); }
    .preview-overview { color: rgba(194,194,194,0.92); font-family: 'roboto'; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .preview-sheet {
        left: 5vw; right: 5vw; top: 6vh;
        border-radius: 10px 10px 0 0;
      }
      .banner-logo { width: 50%; max-width: 50%; }
      .preview-body { padding: 0.75rem 1rem 1rem; }
      .meta-pill { font-size: 0.78rem; padding: 4px 8px; }
    }

    @media (max-width: 480px) {
      .preview-sheet {
        left: 0; right: 0; top: 5vh;
        border-radius: 10px 10px 0 0;
      }
      .banner-logo { width: 60%; max-width: 60%; left: 0.75rem; bottom: 0.75rem; }
      .banner-logo img { max-height: 20vh; }
      .preview-body { padding: 0.5rem 0.75rem 0.75rem; }
      .preview-actions button { font-size: 0.85rem; padding: 6px 10px; }
      .meta-pill { font-size: 0.72rem; padding: 3px 6px; }
    }

    .preview-loader {
      position: absolute; inset: 0; z-index: 10;
      display: flex; align-items: center; justify-content: center;
      background: #030303;
    }
    .preview-loader-logo {
      height: 40px; width: auto;
      filter: brightness(0) invert(1);
      animation: pvPulse 1.4s ease-in-out infinite;
    }
    @keyframes pvPulse {
      0%, 100% { opacity: 0.35; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.06); }
    }
  `],
})
export class PreviewSheetComponent implements OnChanges {
  @Input() open = false;
  @Input() mediaType: 'movie' | 'tv' = 'movie';
  @Input() mediaId: number | null = null;

  @Output() play = new EventEmitter<PreviewPlayEvent>();
  @Output() closed = new EventEmitter<void>();

  loading = false;
  data: any = null;

  // episode state
  pvAllSeasons: TmdbSeasonDetails[] = [];
  pvDisplayedSeasons: TmdbSeasonDetails[] = [];
  pvSeasonsToShow = 10;
  pvShowAllSeasons = false;
  pvEpisodes: TmdbEpisode[] = [];
  pvDisplayedEpisodes: TmdbEpisode[] = [];
  pvEpisodesToShow = 10;
  pvShowAllEpisodes = false;
  pvSelectedSeason = 1;
  pvSelectedEpisodeNumber: number | null = null;
  private pvSavedEpisode: number | null = null;

  constructor(private readonly tmdb: TmdbService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] || changes['mediaId'] || changes['mediaType']) {
      if (this.open && this.mediaId != null) {
        this.load(this.mediaType, this.mediaId);
      }
      if (!this.open) {
        this.reset();
      }
    }
  }

  private reset() {
    this.data = null;
    this.loading = false;
    this.pvResetEpisodeState();
  }

  private load(mediaType: 'movie' | 'tv', id: number) {
    this.loading = true;
    this.data = null;
    this.pvResetEpisodeState();

    if (mediaType === 'movie') {
      forkJoin({
        details: this.tmdb.getMovieDetails(id).pipe(catchError(() => of(null))),
        images: this.tmdb.getMovieImages(id).pipe(catchError(() => of(null))),
      }).subscribe(({ details, images }: any) => {
        this.loading = false;
        if (!details) return;
        const logo = (images?.logos || [])[0];
        this.data = {
          id: details.id, media_type: 'movie', title: details.title,
          overview: details.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          vote_average: details.vote_average, release_date: details.release_date,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path || images?.backdrops?.[0]?.file_path || null,
          logo_path: logo?.file_path || null,
        };
      });
    } else {
      forkJoin({
        details: this.tmdb.getTvDetails(id).pipe(catchError(() => of(null))),
        images: this.tmdb.getTvImages(id).pipe(catchError(() => of(null))),
      }).subscribe(({ details, images }: any) => {
        this.loading = false;
        if (!details) return;
        const logo = (images?.logos || [])[0];
        this.data = {
          id: details.id, media_type: 'tv', title: details.name,
          overview: details.overview,
          genres: details.genres?.map((g: any) => g.name) || [],
          vote_average: details.vote_average, release_date: details.first_air_date,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path || images?.backdrops?.[0]?.file_path || null,
          logo_path: logo?.file_path || null,
        };

        // load seasons / episodes
        const seasons = (details.seasons || []).slice();
        seasons.sort((a: any, b: any) => {
          const aa = a.season_number ?? 0;
          const bb = b.season_number ?? 0;
          if ((aa >= 1) !== (bb >= 1)) return aa >= 1 ? -1 : 1;
          return aa - bb;
        });
        this.pvAllSeasons = seasons;
        this.pvDisplayedSeasons = seasons.slice(0, this.pvSeasonsToShow);
        const prefer = seasons.find((ss: any) => ss.season_number && ss.season_number >= 1) || seasons[0];
        this.pvSelectedSeason = prefer?.season_number || 1;
        this.pvSavedEpisode = null;

        // check continueShows localStorage for saved progress
        try {
          const raw = localStorage.getItem('continueShows');
          if (raw) {
            const entries = JSON.parse(raw) as Array<{ id: number; season?: number | null; episode?: number | null }>;
            const saved = entries.find((e) => e.id === id);
            if (saved) {
              if (saved.season) this.pvSelectedSeason = saved.season;
              if (saved.episode) this.pvSavedEpisode = saved.episode;
            }
          }
        } catch { /* ignore */ }

        this.pvLoadSeasonEpisodes(id, this.pvSelectedSeason);
      });
    }
  }

  onPlay() {
    if (!this.data) return;
    this.play.emit({
      id: this.data.id,
      media_type: this.data.media_type,
      season: this.data.media_type === 'tv' ? this.pvSelectedSeason : null,
      episode: this.data.media_type === 'tv' ? this.pvSelectedEpisodeNumber : null,
    });
  }

  onClose() {
    this.closed.emit();
  }

  // ── episode helpers ──

  private pvResetEpisodeState() {
    this.pvAllSeasons = [];
    this.pvDisplayedSeasons = [];
    this.pvShowAllSeasons = false;
    this.pvEpisodes = [];
    this.pvDisplayedEpisodes = [];
    this.pvShowAllEpisodes = false;
    this.pvSelectedSeason = 1;
    this.pvSelectedEpisodeNumber = null;
  }

  private pvLoadSeasonEpisodes(seriesId: number, seasonNumber: number) {
    this.tmdb.getSeasonDetails(seriesId, seasonNumber).subscribe({
      next: (season) => {
        this.pvEpisodes = (season.episodes || []).slice().sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0));
        this.pvShowAllEpisodes = false;
        this.pvDisplayedEpisodes = this.pvEpisodes.slice(0, this.pvEpisodesToShow);
        if (this.pvEpisodes.length > 0) {
          let target = this.pvEpisodes.find((e) => e.episode_number === 1) || this.pvEpisodes[0];
          if (this.pvSavedEpisode) {
            const saved = this.pvEpisodes.find((e) => e.episode_number === this.pvSavedEpisode);
            if (saved) target = saved;
            this.pvSavedEpisode = null;
          }
          this.pvSelectedEpisodeNumber = target.episode_number;
          const idx = this.pvEpisodes.indexOf(target);
          if (idx >= this.pvEpisodesToShow) {
            this.pvShowAllEpisodes = true;
            this.pvDisplayedEpisodes = this.pvEpisodes.slice();
          }
        }
      },
      error: () => {
        this.pvEpisodes = [];
        this.pvDisplayedEpisodes = [];
      },
    });
  }

  pvSelectSeason(n: number) {
    if (!this.data) return;
    this.pvSelectedSeason = n;
    this.pvLoadSeasonEpisodes(this.data.id, n);
  }

  pvSelectEpisode(ep: TmdbEpisode) {
    if (!this.data) return;
    this.play.emit({
      id: this.data.id,
      media_type: 'tv',
      season: this.pvSelectedSeason,
      episode: ep.episode_number,
    });
  }

  pvToggleLoadMoreSeasons() {
    if (!this.pvShowAllSeasons) {
      this.pvShowAllSeasons = true;
      this.pvDisplayedSeasons = this.pvAllSeasons.slice();
    }
  }

  pvToggleLoadMoreEpisodes() {
    if (!this.pvShowAllEpisodes) {
      this.pvShowAllEpisodes = true;
      this.pvDisplayedEpisodes = this.pvEpisodes.slice();
    } else {
      this.pvShowAllEpisodes = false;
      this.pvDisplayedEpisodes = this.pvEpisodes.slice(0, this.pvEpisodesToShow);
    }
  }
}
