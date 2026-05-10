import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService, TmdbTvDetails } from '../services/tmdb.service';
import { VidsrcService } from '../services/vidsrc.service';
import { VidkingService } from '../services/vidking.service';
import { ProviderService, StreamProvider } from '../services/provider.service';
import { PlayerComponent } from '../player/player';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PartyService } from '../services/party.service';
import { Subscription } from 'rxjs';

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
        [currentSeason]="selectedSeason"
        [currentEpisode]="selectedEpisodeNumber"
        (overlaySave)="saveToContinue()"
        (providerChanged)="onProviderChanged($event)"
        (episodeChanged)="onEpisodeChanged($event)"
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
export class ShowComponent implements OnInit, OnDestroy {
  show: TmdbTvDetails | null = null;
  embedUrl: SafeResourceUrl | null = null;
  selectedSeason = 1;
  selectedEpisodeNumber = 1;
  progressKey: string | null = null;

  private readonly storageKeyShows = 'continueShows';
  savedToContinue = false;
  private providerSub: Subscription | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly tmdb: TmdbService,
    private readonly vidsrc: VidsrcService,
    private readonly vidking: VidkingService,
    private readonly providerSvc: ProviderService,
    private readonly sanitizer: DomSanitizer,
    private readonly party: PartyService,
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
        this.rebuildEmbedUrl();

        // Register content with party service for watch-together
        this.party.currentContent = {
          contentType: 'tv',
          tmdbId: s.id,
          season: this.selectedSeason,
          episode: this.selectedEpisodeNumber,
        };
        this.party.broadcastContent();
      },
      error: (err) => console.error(err),
    });

    // Rebuild URL when the user switches provider
    this.providerSub = this.providerSvc.provider$.subscribe(() => this.rebuildEmbedUrl());
  }

  ngOnDestroy(): void {
    this.providerSub?.unsubscribe();
  }

  onProviderChanged(_p: StreamProvider): void {
    // ProviderService is the source of truth; the subscription handles the rebuild.
  }

  /**
   * The embedded player switched episodes on its own (auto-next or in-player
   * episode picker). Update state, progressKey, party content, and persist
   * to continueShows so refreshing resumes on the new episode.
   * We deliberately DO NOT rebuild the iframe URL — the embed is already
   * playing the new episode; reloading would interrupt playback.
   */
  onEpisodeChanged(evt: { season: number; episode: number }): void {
    if (!this.show) return;
    this.selectedSeason = evt.season;
    this.selectedEpisodeNumber = evt.episode;
    this.progressKey = `tv_${this.show.id}_${evt.season}_${evt.episode}`;
    this.persistContinueShows();

    // Update party content so guests stay in sync on which episode the host moved to.
    this.party.currentContent = {
      contentType: 'tv',
      tmdbId: this.show.id,
      season: evt.season,
      episode: evt.episode,
    };
    this.party.broadcastContent();
  }

  private persistContinueShows(): void {
    const id = this.show?.id;
    if (!id) return;
    let entries: Array<{ id: number; season?: number | null; episode?: number | null }> = [];
    try {
      entries = JSON.parse(localStorage.getItem(this.storageKeyShows) || '[]');
    } catch {
      entries = [];
    }
    const existing = entries.find((e) => e.id === id);
    if (existing) {
      existing.season = this.selectedSeason;
      existing.episode = this.selectedEpisodeNumber;
    } else {
      entries.push({ id, season: this.selectedSeason, episode: this.selectedEpisodeNumber });
    }
    localStorage.setItem(this.storageKeyShows, JSON.stringify(entries));
    this.savedToContinue = true;
    window.dispatchEvent(new CustomEvent('continueShowsUpdated', {
      detail: { id, season: this.selectedSeason, episode: this.selectedEpisodeNumber },
    }));
  }

  saveToContinue(): void {
    this.persistContinueShows();
  }

  private rebuildEmbedUrl(): void {
    if (!this.show || !this.progressKey) return;
    const savedTime = PlayerComponent.getSavedTime(this.progressKey);
    const provider = this.providerSvc.current;
    let raw: string | null = null;

    if (provider === 'vidking') {
      const extra: Record<string, string> = {};
      if (savedTime > 0) extra['progress'] = String(savedTime);
      raw = this.vidking.getEmbedUrlByTmdbTv(this.show.id, this.selectedSeason, this.selectedEpisodeNumber, extra);
    } else {
      const extra: Record<string, string> = {};
      if (savedTime > 0) extra['t'] = String(savedTime);
      raw = this.vidsrc.getEmbedUrlByTmdbTv(this.show.id, this.selectedSeason, this.selectedEpisodeNumber, extra);
    }

    const safeRaw = this.isAllowed(raw, provider) ? raw : null;
    this.embedUrl = safeRaw ? this.sanitizer.bypassSecurityTrustResourceUrl(safeRaw) : null;
  }

  private isAllowed(url: string | null, provider: StreamProvider): boolean {
    if (!url) return false;
    if (provider === 'cinesrc') return url.startsWith('https://cinesrc.st/embed/');
    if (provider === 'vidking') return url.startsWith('https://www.vidking.net/embed/');
    return false;
  }
}
