import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService, TmdbTvDetails, TmdbSeasonDetails, TmdbEpisode } from '../services/tmdb.service';
import { VidsrcService } from '../services/vidsrc.service';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-show',
  standalone: true,
  imports: [NgIf, NgFor, SlicePipe, MatCardModule],
  template: `
    <section class="movie-page" *ngIf="show">
      <mat-card class="movie-header">
        <div class="left">
          <img *ngIf="show.poster_path" [src]="'https://image.tmdb.org/t/p/w500' + show.poster_path" [alt]="show.name" />
        </div>
        <div class="right">
          <h1>{{ show.name }}</h1>
          <p class="sub">{{ show.first_air_date | slice:0:4 }} • {{ show.number_of_seasons || '—' }} seasons</p>
          <p>{{ show.overview }}</p>
        </div>
      </mat-card>

      <div *ngIf="show.id" class="player-wrapper">
        <iframe
          [src]="embedUrl"
          frameborder="0"
          allowfullscreen
          class="player-iframe"
          title="Player for {{ show.name }}"
        ></iframe>

        <div
          *ngIf="!savedToContinue"
          class="player-overlay"
          role="button"
          tabindex="0"
          (click)="saveToContinue()"
          (keydown.enter)="saveToContinue()"
          aria-label="Save to continue watching"
        ></div>
      </div>

      <div class="season-panel" *ngIf="seasons.length > 0">
        <div class="season-select">
          <label for="season">Season</label>
          <select id="season" [value]="selectedSeason" (change)="changeSeason($event)">
            <option *ngFor="let s of seasons" [value]="s.season_number">{{ s.name || ('Season ' + s.season_number) }}</option>
          </select>
        </div>

        <div class="episodes" *ngIf="episodes.length > 0">
          <div *ngFor="let ep of episodes" class="episode" [class.active]="ep.episode_number === selectedEpisodeNumber" (click)="selectEpisode(ep)" tabindex="0">
            <div class="ep-left">
              <div class="ep-num">{{ ep.episode_number }}</div>
            </div>
            <div class="ep-right">
              <div class="ep-title">{{ ep.name }}</div>
              <div class="ep-sub">{{ ep.air_date | slice:0:10 }} • {{ ep.runtime || '—' }} min</div>
            </div>
          </div>
        </div>
      </div>

      <p *ngIf="!embedUrl" class="no-embed">No embed available for this title.</p>
    </section>
  `,
  styles: [
    `
      .movie-page { padding: 1rem; max-width: 980px; margin: 0 auto; }
      .movie-header { display:flex; gap:1rem; padding:1rem; align-items:flex-start; }
      .movie-header img { width: 160px; height: 240px; object-fit:cover; border-radius:6px; }
      .movie-header .right h1 { margin:0 0 0.5rem 0; font-size:1.25rem; }
      .sub { color:#6b7280; margin-bottom:0.75rem; }
      .player-wrapper { margin-top:1rem; position:relative; padding-top:56.25%; }
      .player-iframe { position:absolute; top:0; left:0; width:100%; height:100%; border-radius:6px; border:0; }
      .player-overlay { position:absolute; top:0; left:0; width:100%; height:100%; z-index:30; background:transparent; cursor:pointer; }
      .no-embed { color:#6b7280; margin-top:1rem; }

      .season-panel { margin-top:1rem; }
      .season-select { margin-bottom:0.75rem; display:flex; gap:0.5rem; align-items:center; }
      .season-select select { padding:0.4rem 0.5rem; border-radius:6px; border:1px solid #e6e6e6; }

      .episodes { display:flex; flex-direction:column; gap:0.4rem; }
      .episode { display:flex; gap:0.6rem; align-items:center; padding:0.5rem; border-radius:6px; cursor:pointer; border:1px solid #eee; }
      .episode:hover { background:#fafafa; }
      .episode.active { background:#eef2ff; border-color:#dbeafe; }
      .ep-left { width:36px; display:flex; align-items:center; justify-content:center; }
      .ep-num { font-weight:700; color:#374151; }
      .ep-title { font-weight:600; }
      .ep-sub { color:#6b7280; font-size:0.9rem; }
    `,
  ],
})
export class ShowComponent implements OnInit {
  show: TmdbTvDetails | null = null;
  embedUrl: SafeResourceUrl | null = null;

  seasons: TmdbSeasonDetails[] = [];
  episodes: TmdbEpisode[] = [];
  selectedSeason = 1;
  selectedEpisodeNumber: number | null = null;

  private readonly storageKey = 'continueMovies';
  savedToContinue = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly tmdb: TmdbService,
    private readonly vidsrc: VidsrcService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.tmdb.getTvDetails(id).subscribe({
      next: (s) => {
        this.show = s;
        // populate seasons list from show details
        this.seasons = s.seasons || [];
        // choose initial season (prefer 1 or the first non-zero season)
        this.selectedSeason = this.seasons.find((ss) => ss.season_number && ss.season_number > 0)?.season_number || 1;
        this.loadSeasonEpisodes(s.id, this.selectedSeason);
      },
      error: (err) => console.error(err),
    });
  }

  private loadSeasonEpisodes(seriesId: number, seasonNumber: number) {
    this.tmdb.getSeasonDetails(seriesId, seasonNumber).subscribe({
      next: (season) => {
        this.episodes = season.episodes || [];
        // set a default embed to first episode if available
        if (this.episodes.length > 0) {
          const ep = this.episodes[0];
          this.selectedEpisodeNumber = ep.episode_number;
          const raw = this.vidsrc.getEmbedUrlByTmdbTv(seriesId, seasonNumber, ep.episode_number);
          this.embedUrl = raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
        } else {
          this.embedUrl = null;
        }
      },
      error: (err) => {
        console.error(err);
        this.episodes = [];
        this.embedUrl = null;
      }
    });
  }

  changeSeason(seasonNumberOrEvent: number | Event) {
    if (!this.show) return;
    let n: number;
    if (typeof seasonNumberOrEvent === 'number') {
      n = seasonNumberOrEvent;
    } else {
      const target = seasonNumberOrEvent.target as HTMLSelectElement | null;
      if (!target) return;
      n = Number(target.value);
    }
    this.selectedSeason = n;
    this.loadSeasonEpisodes(this.show.id, n);
  }

  selectEpisode(ep: TmdbEpisode) {
    if (!this.show) return;
    this.selectedEpisodeNumber = ep.episode_number;
    const raw = this.vidsrc.getEmbedUrlByTmdbTv(this.show.id, ep.season_number, ep.episode_number);
    this.embedUrl = raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
  }

  saveToContinue(): void {
    const id = this.show?.id;
    if (!id) return;
    let ids: number[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(this.storageKey) || '[]') as number[];
    } catch {
      ids = [];
    }
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(this.storageKey, JSON.stringify(ids));
    }
    this.savedToContinue = true;
    window.dispatchEvent(new CustomEvent('continueMoviesUpdated', { detail: { id } }));
  }
}
