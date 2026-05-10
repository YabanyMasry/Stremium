import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService, TmdbMovieDetails } from '../services/tmdb.service';
import { VidsrcService } from '../services/vidsrc.service';
import { VidkingService } from '../services/vidking.service';
import { ProviderService, StreamProvider } from '../services/provider.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlayerComponent } from '../player/player';
import { PartyService } from '../services/party.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [NgIf, PlayerComponent],
  template: `
    <section class="movie-page" *ngIf="movie">
      <app-player
        *ngIf="movie.id"
        [src]="embedUrl"
        [title]="'Player for ' + movie.title"
        [saved]="savedToContinue"
        [progressKey]="progressKey"
        (overlaySave)="saveToContinue()"
        (providerChanged)="onProviderChanged($event)"
      ></app-player>

      <p *ngIf="!embedUrl" class="no-embed">No embed available for this title.</p>
    </section>
  `,
  styles: [
    `
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

      app-player {
        display: block;
        width: 100%;
        height: 100%;
      }

      .no-embed { color:#9ca3af; position: absolute; z-index: 40; font-size: 1rem; }
    `,
  ],
})
export class MovieComponent implements OnInit, OnDestroy {
  movie: TmdbMovieDetails | null = null;
  embedUrl: SafeResourceUrl | null = null;
  progressKey: string | null = null;

  private readonly storageKey = 'continueMovies';
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

    this.tmdb.getMovieDetails(id).subscribe({
      next: (m) => {
        this.movie = m;
        this.progressKey = `movie_${m.id}`;
        this.rebuildEmbedUrl();

        // Register content with party service for watch-together
        this.party.currentContent = { contentType: 'movie', tmdbId: m.id };
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
    // ProviderService is the source of truth; the subscription above handles the rebuild.
  }

  saveToContinue(): void {
    const id = this.movie?.id;
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

  private rebuildEmbedUrl(): void {
    if (!this.movie || !this.progressKey) return;
    const savedTime = PlayerComponent.getSavedTime(this.progressKey);
    const provider = this.providerSvc.current;
    let raw: string | null = null;

    if (provider === 'vidking') {
      const extra: Record<string, string> = {};
      if (savedTime > 0) extra['progress'] = String(savedTime);
      raw = this.vidking.getEmbedUrlByTmdb(this.movie.id, extra);
    } else {
      const extra: Record<string, string> = {};
      if (savedTime > 0) extra['t'] = String(savedTime);
      raw = this.vidsrc.getEmbedUrlByTmdb(this.movie.id, extra);
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
