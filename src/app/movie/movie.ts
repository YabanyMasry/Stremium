import { Component, OnInit } from '@angular/core';
import { NgIf, SlicePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TmdbService, TmdbMovieDetails } from '../services/tmdb.service';
import { VidsrcService } from '../services/vidsrc.service';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [NgIf, SlicePipe, MatCardModule],
  template: `
    <section class="movie-page" *ngIf="movie">
      <mat-card class="movie-header">
        <div class="left">
          <img *ngIf="movie.poster_path" [src]="'https://image.tmdb.org/t/p/w500' + movie.poster_path" [alt]="movie.title" />
        </div>
        <div class="right">
          <h1>{{ movie.title }}</h1>
          <p class="sub">{{ movie.release_date | slice:0:4 }} • {{ movie.runtime || '—' }} min</p>
          <p>{{ movie.overview }}</p>
        </div>
      </mat-card>

      <div *ngIf="movie.id" class="player-wrapper">
        <iframe
          [src]="embedUrl"
          frameborder="0"
          allowfullscreen
          class="player-iframe"
          title="Player for {{ movie.title }}"
        ></iframe>

        <!-- transparent overlay captures the first click to save, then disappears -->
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
    `,
  ],
})
export class MovieComponent implements OnInit {
  movie: TmdbMovieDetails | null = null;
  embedUrl: SafeResourceUrl | null = null;

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

    this.tmdb.getMovieDetails(id).subscribe({
      next: (m) => {
        this.movie = m;
        // build embed url using the TMDB id (service returns string)
        const raw = this.vidsrc.getEmbedUrlByTmdb(m.id);
        this.embedUrl = raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
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