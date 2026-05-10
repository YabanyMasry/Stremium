import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { TmdbSeasonDetails, TmdbEpisode } from '../services/tmdb.service';

@Component({
  selector: 'app-episode-controls',
  standalone: true,
  imports: [NgIf, NgFor, SlicePipe],
  template: `

  <div>
            <div class="select-box">
          <div class="select-left">{{ episodes.length }} episode{{ episodes.length === 1 ? '' : 's' }}</div>
          <div class="select-right">
            <div class="combo-wrap">
              <button type="button" class="combo-trigger" (click)="toggleSeasonOpen()" [attr.aria-expanded]="seasonOpen" aria-haspopup="listbox">
                <span class="combo-value">{{ getSelectedSeasonLabel() }}</span>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 7l5 5 5-5" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>

              <ul *ngIf="seasonOpen" class="combo-list" role="listbox">
                <li *ngFor="let s of displayedSeasons" role="option" class="combo-item" [class.selected]="(s.season_number || 0) === selectedSeason" (click)="onSelectSeason(s.season_number || 0)">{{ (s.season_number || 0) >=1 ? ('Season ' + (s.season_number || 0)) : (s.name || 'Specials') }}</li>
              </ul>
            </div>
          </div>
        </div>
</div>
    <div class="controls-panel">
      <div class="episodes" *ngIf="episodes.length > 0">


        <div *ngFor="let ep of displayedEpisodes" class="episode" [class.active]="ep.episode_number === selectedEpisodeNumber" (click)="onSelectEpisode(ep)" tabindex="0">
          <div class="ep-still">
            <img *ngIf="ep.still_path" [src]="'https://image.tmdb.org/t/p/w300' + ep.still_path" [alt]="ep.name" class="still-img" />
            <div *ngIf="!ep.still_path" class="still-placeholder">{{ ep.episode_number }}</div>
            <div class="ep-num-badge">{{ ep.episode_number }}</div>
          </div>
          <div class="ep-right">
            <div class="ep-title">{{ ep.name }}</div>
            <div class="ep-sub">{{ ep.air_date | slice:0:10 }} • {{ ep.runtime || '—' }} min</div>
            <div class="ep-overview" *ngIf="ep.overview">{{ ep.overview }}</div>
          </div>
        </div>
      </div>


    </div>
          <div class="episodes-more" *ngIf="episodes.length > episodesToShow">
        <button class="pill-btn" (click)="toggleLoadMoreEpisodes.emit()">{{ showAllEpisodes ? 'Show less' : 'Load more episodes' }}</button>
      </div>
  `,
  styles: [
    `
      .controls-panel {
        margin-top: 0.8rem;
        border-radius: 14px;
        padding: 0;
        background: rgba(255,255,255,0.03);
        box-shadow: 0 12px 30px rgba(0,0,0,0.35);
        border: 1px solid rgba(255,255,255,0.06);
        overflow: hidden;
      }

      .select-box { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0.5rem; }
      .select-left { font-weight: 700; color: rgba(255,255,255,0.7); }

      .select-right { display: flex; gap: 0.5rem; align-items: center; position: relative; }
      .combo-wrap { display: flex; gap: 0.5rem; align-items: center; }

      .combo-trigger {
        display: flex; align-items: center; gap: 0.5rem; justify-content: space-between;
        min-width: 160px; padding: 0.5rem 0.75rem; border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(8px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.3);
        cursor: pointer; font-weight: 600; color: #fff;
        transition: background 160ms ease, box-shadow 160ms ease;
      }
      .combo-trigger:hover { background: rgba(255,255,255,0.10); }
      .combo-trigger svg path { stroke: rgba(255,255,255,0.5); }

      .combo-list {
        position: absolute; right: 0; top: calc(100% + 8px); z-index: 60;
        list-style: none; margin: 0; padding: 0.25rem 0;
        background: rgba(20,20,20,0.92);
        backdrop-filter: blur(14px);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        width: 220px; max-height: 240px; overflow: auto;
      }
      .combo-item { padding: 0.5rem 0.75rem; cursor: pointer; color: rgba(255,255,255,0.85); font-weight: 600; transition: background 120ms ease; }
      .combo-item:hover { background: rgba(255,255,255,0.08); }
      .combo-item.selected { background: rgba(255,255,255,0.12); }

      .episodes { display: flex; flex-direction: column; gap: 0; margin: 0; }

      .episode {
        display: flex; gap: 0.8rem; align-items: center; padding: 0.75rem 0.75rem;
        cursor: pointer; background: transparent; border: 0;
        transition: background 140ms ease;
      }
      .episode + .episode { border-top: 1px solid rgba(255,255,255,0.06); }
      .episode:hover { background: rgba(255,255,255,0.05); }
      .episode.active { background: rgba(255,255,255,0.08); }

      .ep-still {
        position: relative;
        flex: 0 0 130px;
        width: 130px;
        height: 74px;
        border-radius: 8px;
        overflow: hidden;
        background: rgba(255,255,255,0.04);
      }
      .still-img {
        width: 100%; height: 100%; object-fit: cover; display: block;
      }
      .still-placeholder {
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 1.4rem; color: rgba(255,255,255,0.2);
      }
      .ep-num-badge {
        position: absolute; bottom: 4px; left: 4px;
        background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
        color: rgba(255,255,255,0.9); font-weight: 700; font-size: 0.7rem;
        padding: 2px 6px; border-radius: 6px; line-height: 1.2;
      }

      .ep-right { flex: 1; min-width: 0; }
      .ep-title { font-weight: 600; color: #fff; }
      .ep-sub { color: rgba(255,255,255,0.45); font-size: 0.85rem; margin-top: 2px; }
      .ep-overview {
        color: rgba(255,255,255,0.38);
        font-size: 0.82rem;
        line-height: 1.4;
        margin-top: 4px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .episodes-more { display: flex; justify-content: center; padding-top: 0.75rem; padding-bottom: 0.25rem; }

      .pill-btn {
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: rgba(255,255,255,0.85);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 0.5rem 1.4rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
        transition: transform 180ms ease, background 180ms ease, box-shadow 180ms ease;
      }
      .pill-btn:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,0.10);
        box-shadow: 0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12);
      }
      .pill-btn:active { transform: translateY(0); }

      /* ── Mobile ── */
      @media (max-width: 768px) {
        .select-box { padding: 0.5rem 0.4rem; flex-wrap: wrap; gap: 0.4rem; }
        .select-left { font-size: 0.85rem; }
        .combo-trigger { min-width: 130px; padding: 0.4rem 0.6rem; font-size: 0.85rem; }
        .combo-list { width: 180px; }
        .ep-still { flex: 0 0 100px; width: 100px; height: 56px; }
        .episode { padding: 0.6rem 0.5rem; gap: 0.6rem; }
        .ep-title { font-size: 0.9rem; }
        .ep-sub { font-size: 0.78rem; }
        .ep-overview { font-size: 0.75rem; -webkit-line-clamp: 1; }
      }

      @media (max-width: 480px) {
        .select-box { flex-direction: column; align-items: flex-start; gap: 0.3rem; padding: 0.4rem; }
        .combo-trigger { min-width: 100%; }
        .combo-list { width: 100%; left: 0; right: 0; }
        .ep-still { flex: 0 0 80px; width: 80px; height: 45px; }
        .episode { padding: 0.5rem 0.4rem; gap: 0.5rem; }
        .ep-title { font-size: 0.85rem; }
        .ep-sub { font-size: 0.72rem; }
        .ep-overview { display: none; }
        .ep-num-badge { font-size: 0.6rem; padding: 1px 4px; }
      }
    `,
  ],
})
export class EpisodeControlsComponent {
  @Input() displayedSeasons: TmdbSeasonDetails[] = [];
  @Input() displayedEpisodes: TmdbEpisode[] = [];
  @Input() episodes: TmdbEpisode[] = [];
  @Input() selectedSeason = 1;
  @Input() selectedEpisodeNumber: number | null = null;
  @Input() showAllSeasons = false;
  @Input() showAllEpisodes = false;
  @Input() episodesToShow = 10;
  @Input() seasonsToShow = 10;
  @Input() allSeasonsLength = 0;

  @Output() seasonSelected = new EventEmitter<number>();
  @Output() episodeSelected = new EventEmitter<TmdbEpisode>();
  @Output() toggleLoadMoreSeasons = new EventEmitter<void>();
  @Output() toggleLoadMoreEpisodes = new EventEmitter<void>();

  seasonOpen = false;

  toggleSeasonOpen() {
    this.seasonOpen = !this.seasonOpen;
  }

  onSelectSeason(n: number) {
    this.seasonOpen = false;
    this.seasonSelected.emit(n);
  }

  onSelectEpisode(ep: TmdbEpisode) {
    this.episodeSelected.emit(ep);
  }

  getSelectedSeasonLabel(): string {
    const s = this.displayedSeasons.find((ss) => (ss.season_number || 0) === this.selectedSeason);
    if (s) return (s.season_number || 0) >= 1 ? ('Season ' + (s.season_number || 0)) : (s.name || 'Specials');
    return 'Season ' + this.selectedSeason;
  }
}
