import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService, TmdbMovieDetails } from '../services/tmdb.service';
import { VidsrcService } from '../services/vidsrc.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlayerComponent } from '../player/player';
import { PartyService } from '../services/party.service';

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
export class MovieComponent implements OnInit {
  movie: TmdbMovieDetails | null = null;
  embedUrl: SafeResourceUrl | null = null;
  progressKey: string | null = null;

  private readonly storageKey = 'continueMovies';
  savedToContinue = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly tmdb: TmdbService,
    private readonly vidsrc: VidsrcService,
    private readonly sanitizer: DomSanitizer,
    private readonly party: PartyService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.tmdb.getMovieDetails(id).subscribe({
      next: (m) => {
        this.movie = m;
        // build progress key and check for saved time
        this.progressKey = `movie_${m.id}`;
        const savedTime = PlayerComponent.getSavedTime(this.progressKey);
        const extra: Record<string, string> = {};
        if (savedTime > 0) extra['t'] = String(savedTime);
        // build embed url using the TMDB id (service returns string)
        const raw = this.vidsrc.getEmbedUrlByTmdb(m.id, extra);
        const safeRaw = raw && raw.startsWith('https://cinesrc.st/embed/') ? raw : null;
        this.embedUrl = safeRaw ? this.sanitizer.bypassSecurityTrustResourceUrl(safeRaw) : null;

        // Register content with party service for watch-together
        this.party.currentContent = { contentType: 'movie', tmdbId: m.id };
        this.party.broadcastContent();
      },
      error: (err) => {
        console.error(err);
      }
    });
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
    // mark saved so overlay no longer shows
    this.savedToContinue = true;
    console.log('savedToContinue:', id);
    // dispatch a simple event so other components can react if needed
    window.dispatchEvent(new CustomEvent('continueMoviesUpdated', { detail: { id } }));
  }
}