import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService, TmdbTvDetails } from '../services/tmdb.service';
import { VidsrcService } from '../services/vidsrc.service';
import { PlayerComponent } from '../player/player';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-show',
  standalone: true,
  imports: [NgIf, PlayerComponent],
  template: `
    <section class="movie-page" *ngIf="show">
      <app-player
        *ngIf="show.id"
        [src]="embedUrl"
        [title]="'Player for ' + show.name"
        [saved]="savedToContinue"
        [progressKey]="progressKey"
        (overlaySave)="saveToContinue()"
      ></app-player>

      <p *ngIf="!embedUrl" class="no-embed">No embed available for this title.</p>
    </section>
  `,
  styles: [`
    .movie-page {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      margin: 0;
      padding: 0;
      z-index: 9999;
    }
    app-player { display: block; width: 100%; height: 100%; }
    .no-embed { color:#9ca3af; position: absolute; z-index: 40; font-size: 1rem; }
  `],
})
export class ShowComponent implements OnInit {
  show: TmdbTvDetails | null = null;
  embedUrl: SafeResourceUrl | null = null;
  selectedSeason = 1;
  selectedEpisodeNumber = 1;
  progressKey: string | null = null;

  private readonly storageKeyShows = 'continueShows';
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

    // read season/episode from query params (e.g. from preview sheet)
    const qSeason = Number(this.route.snapshot.queryParamMap.get('season')) || 0;
    const qEpisode = Number(this.route.snapshot.queryParamMap.get('episode')) || 0;

    this.tmdb.getTvDetails(id).subscribe({
      next: (s) => {
        this.show = s;

        // prefer Season 1 if available
        const prefer = (s.seasons || []).find((ss) => ss.season_number && ss.season_number >= 1);
        this.selectedSeason = prefer?.season_number || 1;
        this.selectedEpisodeNumber = 1;

        // restore saved progress from localStorage
        try {
          const raw = localStorage.getItem(this.storageKeyShows);
          if (raw) {
            const entries = JSON.parse(raw) as Array<{ id: number; season?: number | null; episode?: number | null }>;
            const existing = entries.find((e) => e.id === id);
            if (existing) {
              this.savedToContinue = true;
              if (existing.season) this.selectedSeason = existing.season;
              if (existing.episode) this.selectedEpisodeNumber = existing.episode;
            }
          }
        } catch { /* ignore */ }

        // query params take highest priority (user explicitly picked an episode)
        if (qSeason) this.selectedSeason = qSeason;
        if (qEpisode) this.selectedEpisodeNumber = qEpisode;

        this.progressKey = `tv_${s.id}_${this.selectedSeason}_${this.selectedEpisodeNumber}`;
        const savedTime = PlayerComponent.getSavedTime(this.progressKey);
        const extra: Record<string, string> = {};
        if (savedTime > 0) extra['t'] = String(savedTime);
        const raw = this.vidsrc.getEmbedUrlByTmdbTv(s.id, this.selectedSeason, this.selectedEpisodeNumber, extra);
        this.embedUrl = raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
      },
      error: (err) => console.error(err),
    });
  }

  saveToContinue(): void {
    const id = this.show?.id;
    if (!id) return;
    let entries: Array<{ id: number; season?: number | null; episode?: number | null }> = [];
    try {
      entries = JSON.parse(localStorage.getItem(this.storageKeyShows) || '[]');
    } catch {
      entries = [];
    }
    const existing = entries.find((e) => e.id === id);
    const progress = { id, season: this.selectedSeason, episode: this.selectedEpisodeNumber };
    if (existing) {
      existing.season = progress.season;
      existing.episode = progress.episode;
    } else {
      entries.push(progress);
    }
    localStorage.setItem(this.storageKeyShows, JSON.stringify(entries));
    this.savedToContinue = true;
    window.dispatchEvent(new CustomEvent('continueShowsUpdated', { detail: { id, season: this.selectedSeason, episode: this.selectedEpisodeNumber } }));
  }
}
